'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { uploadAnalysisFile } from '@/lib/storage'
import AnalysisAccordion, {
  type PendingFile,
  type StoredAnalysisFile,
} from '@/components/analysis/AnalysisAccordion'
import { SECTIONS, type SectionData } from '@/lib/analysis-sections'

export default function AnalyzaPage() {
  const [data, setData] = useState<Record<string, SectionData>>({})
  const [expandedSections, setExpandedSections] = useState<string[]>([SECTIONS[0].id])
  const [files, setFiles] = useState<PendingFile[]>([])
  const [existingFiles, setExistingFiles] = useState<StoredAnalysisFile[]>([])
  const [fileError, setFileError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [userId, setUserId] = useState<string | null>(null)

  const fileRef = useRef<HTMLInputElement>(null)
  const activeUploadSection = useRef<string>(SECTIONS[0].id)
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const supabase = useMemo(() => createClient(), [])

  function updateField(sectionId: string, questionId: string, value: string) {
    setData(prev => ({
      ...prev,
      [sectionId]: { ...prev[sectionId], [questionId]: value },
    }))
  }

  function toggleSection(id: string) {
    setExpandedSections(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  function pickFiles(sectionId: string) {
    activeUploadSection.current = sectionId
    fileRef.current?.click()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return
    const newFiles = Array.from(e.target.files).map(f => ({
      name: f.name,
      size: f.size,
      section: activeUploadSection.current,
      file: f,
    }))
    setFiles(prev => [...prev, ...newFiles])
    e.target.value = ''
  }

  // Přihlášený uživatel
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id)
    })
  }, [supabase])

  // Načtení dosud uložených odpovědí a příloh
  useEffect(() => {
    if (!userId) return
    fetch(`/api/analysis?clientId=${userId}`)
      .then(res => res.json())
      .then(result => {
        if (result.responses && Object.keys(result.responses).length > 0) {
          setData(result.responses)
        }
        if (Array.isArray(result.files)) {
          setExistingFiles(result.files)
        }
      })
      .catch(() => {})
  }, [userId])

  // Automatické ukládání (debounce 2 s)
  const initialLoad = useRef(true)
  useEffect(() => {
    if (!userId || Object.keys(data).length === 0) return
    if (initialLoad.current) { initialLoad.current = false; return }

    if (saveTimeout.current) clearTimeout(saveTimeout.current)
    setSaveStatus('saving')
    saveTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch('/api/analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientId: userId, responses: data }),
        })
        setSaveStatus(res.ok ? 'saved' : 'error')
      } catch {
        setSaveStatus('error')
      }
    }, 2000)
  }, [data, userId])

  async function handleSubmit() {
    setLoading(true)
    setFileError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      // Nahrát přílohy do storage – bez toho by je poradce nikdy neviděl
      const failed: PendingFile[] = []
      const errors: string[] = []
      for (const f of files) {
        const result = await uploadAnalysisFile(supabase, user.id, f.section, f.file)
        if (result.ok) {
          setExistingFiles(prev => [
            ...prev,
            { id: result.path, section: f.section, file_name: f.name, file_url: result.path, file_size: f.size },
          ])
        } else {
          failed.push(f)
          errors.push(result.error)
        }
      }
      setFiles(failed)
      if (failed.length > 0) {
        setFileError(`Některé přílohy se nepodařilo nahrát: ${errors.join(' · ')}. Odpovědi jsou uložené – zkuste soubory odeslat znovu.`)
        setLoading(false)
        return
      }

      try {
        await fetch('/api/analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientId: user.id, responses: data }),
        })
      } catch {}

      await supabase.from('profiles').update({
        onboarding_completed: true,
        goals: Object.keys(data),
      }).eq('id', user.id)
    }
    setSubmitted(true)
    setLoading(false)
  }

  if (submitted) {
    return (
      <div className="max-w-3xl mx-auto px-6 md:px-10 py-16 md:py-24 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="section-numeral text-[4rem] md:text-[6rem] mb-3">✓</div>
          <p className="text-xs tracking-[0.3em] uppercase text-[#66708C] mb-2">Hotovo · poradce je o tom ví</p>
          <h1
            className="font-display text-[#162459] mb-5"
            style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.02em', lineHeight: 1.05 }}
          >
            Analýza <span style={{ color: '#009EE2' }}>odeslána</span>.
          </h1>
          <p className="text-[#66708C] mb-10 max-w-md mx-auto leading-relaxed">
            Váš poradce připraví finanční plán na základě vašich odpovědí. Výsledky obvykle do 48 hodin.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-none font-semibold text-white text-[15px] transition-all hover:shadow-lg hover:shadow-[#009EE2]/25 hover:-translate-y-0.5"
            style={{ background: '#162459' }}
          >
            <ArrowLeft className="w-4 h-4" /> Zpět na přehled
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16 xl:px-20 py-10 md:py-14">
      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="mb-10"
      >
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-[#66708C] hover:text-[#162459] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Zpět
        </Link>
        <p className="text-xs tracking-[0.3em] uppercase text-[#66708C] mb-2">Analýza · o vaší situaci</p>
        <div className="flex items-start justify-between gap-4">
          <h1
            className="font-display text-[#162459]"
            style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.02em', lineHeight: 1.05 }}
          >
            Finanční <span style={{ color: '#009EE2' }}>analýza</span>
          </h1>
          {saveStatus !== 'idle' && (
            <div className="flex items-center gap-2 text-xs mt-2 shrink-0">
              <span
                className={`w-2 h-2 rounded-full ${
                  saveStatus === 'saving'
                    ? 'bg-[#f59e0b] animate-pulse'
                    : saveStatus === 'saved'
                      ? 'bg-[#16a34a]'
                      : 'bg-[#ea580c]'
                }`}
              />
              <span className="text-[#66708C]">
                {saveStatus === 'saving' ? 'Ukládám…' : saveStatus === 'saved' ? 'Uloženo' : 'Chyba'}
              </span>
            </div>
          )}
        </div>
        <p className="text-[#66708C] mt-3 max-w-xl leading-relaxed">
          Odpovězte na otázky v jednotlivých sekcích. Čím víc vyplníte, tím přesnější plán dostanete. Průběh se ukládá sám.
        </p>
      </motion.div>

      <AnalysisAccordion
        data={data}
        onChange={updateField}
        expanded={expandedSections}
        onToggle={toggleSection}
        pendingFiles={files}
        onPickFiles={pickFiles}
        onRemoveFile={name => setFiles(prev => prev.filter(f => f.name !== name))}
        storedFiles={existingFiles}
      />

      {fileError && (
        <div className="mt-6 p-4 bg-[rgba(234,88,12,0.08)] border border-[rgba(234,88,12,0.3)] rounded-none text-sm text-[#c2410c]">
          {fileError}
        </div>
      )}

      <motion.div
        className="mt-10 flex justify-end"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="inline-flex items-center gap-2 px-7 py-3.5 rounded-none font-semibold text-white text-[15px] transition-all disabled:opacity-50 hover:shadow-lg hover:shadow-[#009EE2]/25 hover:-translate-y-0.5"
          style={{ background: '#162459' }}
        >
          {loading ? 'Odesílám…' : 'Odeslat analýzu'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </motion.div>
    </div>
  )
}
