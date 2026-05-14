'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, ArrowRight, Check, Upload, Shield, Home, Clock, Baby,
  TrendingUp, Building2, ChevronDown, ChevronUp, FileText, X, UserCircle
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { createClient } from '@/lib/supabase/client'

interface SectionData {
  [key: string]: string
}

interface UploadedFile {
  name: string
  size: number
  section: string
}

const sections = [
  {
    id: 'income',
    title: 'Zajištění příjmů',
    icon: Shield,
    color: 'from-[#162459] to-[#243471]',
    questions: [
      { id: 'employment', label: 'Jaký je váš pracovní poměr?', type: 'select', options: ['Zaměstnanec', 'OSVČ', 'Kombinace', 'Student', 'Důchodce'] },
      { id: 'monthly_income', label: 'Čistý měsíční příjem (Kč)', type: 'number', placeholder: '35 000' },
      { id: 'income_drop', label: 'Když vám klesne příjem na 60 %, kolik Kč chcete dostat, aby peníze nebyl problém?', type: 'number', placeholder: '20 000' },
      { id: 'permanent_consequences', label: 'V případě trvalých následků chcete být zajištěn/a?', type: 'select', options: ['Ano', 'Ne'] },
      { id: 'invalidity', label: 'V případě invalidity chcete být zajištěn/a?', type: 'select', options: ['Ano', 'Ne'] },
      { id: 'serious_illness', label: 'V případě závažné nemoci chcete být zajištěn/a?', type: 'select', options: ['Ano', 'Ne'] },
      { id: 'long_term_care', label: 'Chcete být zajištěn/a v případě dlouhodobé péče?', type: 'select', options: ['Ano', 'Ne'] },
      { id: 'death_coverage', label: 'V případě smrti chcete mít zajištěné splacení závazku?', type: 'select', options: ['Ano', 'Ne'] },
      { id: 'death_coverage_amount', label: 'Pokud ano, kolik Kč je potřeba na splacení závazků?', type: 'number', placeholder: '1 000 000' },
      { id: 'monthly_budget', label: 'Kolik Kč jste ochotný/á platit za tento produkt měsíčně?', type: 'number', placeholder: '1 500' },
      { id: 'preferred_companies', label: 'Máte nějaké společnosti, které preferujete?', type: 'checkbox', options: ['ČPP', 'Kooperativa', 'Allianz', 'MetLife', 'Generali', 'NN', 'Uniqa', 'Všechny'] },
    ],
  },
  {
    id: 'housing',
    title: 'Bydlení',
    icon: Home,
    color: 'from-[#009EE2] to-[#0088c6]',
    questions: [
      { id: 'has_mortgage', label: 'Máte hypotéku?', type: 'select', options: ['Ano', 'Ne'] },
      { id: 'plan_mortgage', label: 'Pokud ne, plánujete ji řešit?', type: 'select', options: ['Ano', 'Ne', 'Možná v budoucnu'] },
      { id: 'mortgage_amount', label: 'Jakou výši úvěru chcete?', type: 'number', placeholder: '3 000 000' },
      { id: 'property_type', label: 'Jakou nemovitost chcete koupit?', type: 'select', options: ['Byt', 'Dům', 'Pozemek', 'Jiné'] },
      { id: 'mortgage_timeline', label: 'Za jak dlouho plánujete koupi?', type: 'select', options: ['Do 6 měsíců', 'Do 1 roku', 'Do 2 let', 'Do 5 let', 'Nevím'] },
      { id: 'mortgage_location', label: 'Kde chcete nemovitost koupit?', type: 'text', placeholder: 'Praha, Brno, ...' },
    ],
  },
  {
    id: 'retirement',
    title: 'Příprava na důchod',
    icon: Clock,
    color: 'from-[#162459] to-[#243471]',
    questions: [
      { id: 'current_savings', label: 'Kolik si aktuálně odkládáte na důchod? (Kč/měsíc)', type: 'number', placeholder: '500' },
      { id: 'pension_gap', label: 'Když byste od zítra pobírali důchod 9 000 Kč, kolik Kč byste ještě potřebovali k tomu?', type: 'number', placeholder: '15 000' },
      { id: 'monthly_pension_budget', label: 'Kolik si můžete měsíčně odkládat na důchod? (Kč)', type: 'number', placeholder: '2 000' },
    ],
  },
  {
    id: 'children',
    title: 'Děti',
    icon: Baby,
    color: 'from-[#009EE2] to-[#0088c6]',
    questions: [
      { id: 'children_count', label: 'Kolik máte dětí?', type: 'number', placeholder: '0' },
      { id: 'children_ages', label: 'Jaký je jejich věk? (oddělte čárkou)', type: 'text', placeholder: '5, 8, 12' },
      { id: 'children_insurance', label: 'Přejete si je pojistit v případě úrazu/nemoci?', type: 'select', options: ['Ano', 'Ne'] },
      { id: 'children_savings', label: 'Přejete si spořit dítěti?', type: 'select', options: ['Ano', 'Ne'] },
      { id: 'children_monthly', label: 'Kolik můžete měsíčně spořit? (Kč)', type: 'number', placeholder: '1 000' },
      { id: 'children_notes', label: 'Poznámky', type: 'text', placeholder: 'Další informace...' },
    ],
  },
  {
    id: 'investing',
    title: 'Investice',
    icon: TrendingUp,
    color: 'from-[#162459] to-[#243471]',
    questions: [
      { id: 'investing_experience', label: 'Zkušenosti s investováním', type: 'select', options: ['Žádné', 'Začátečník', 'Mírně pokročilý', 'Pokročilý'] },
      { id: 'risk_tolerance', label: 'Tolerance k riziku', type: 'select', options: ['Konzervativní', 'Vyvážený', 'Dynamický', 'Agresivní'] },
      { id: 'investment_horizon', label: 'Investiční horizont', type: 'select', options: ['1–3 roky', '3–5 let', '5–10 let', '10+ let'] },
      { id: 'monthly_invest', label: 'Kolik měsíčně chcete investovat (Kč)', type: 'number', placeholder: '3 000' },
      { id: 'current_investments', label: 'Stávající investice', type: 'select', options: ['Nemám žádné', 'Podílové fondy', 'ETF / akcie', 'Krypto', 'Kombinace'] },
    ],
  },
  {
    id: 'property',
    title: 'Pojištění majetku',
    icon: Building2,
    color: 'from-[#009EE2] to-[#0088c6]',
    questions: [
      { id: 'has_car', label: 'Vlastníte auto?', type: 'select', options: ['Ano', 'Ne'] },
      { id: 'car_insurance', label: 'Jak jej máte pojištěné?', type: 'select', options: ['Povinné ručení', 'Povinné ručení + havarijní', 'Nemám pojištění', 'Nevlastním auto'] },
      { id: 'car_recalculate', label: 'Chcete přepočítat stávající pojištění?', type: 'select', options: ['Ano', 'Ne'] },
      { id: 'has_property', label: 'Vlastníte nemovitost?', type: 'select', options: ['Ano', 'Ne'] },
      { id: 'property_type', label: 'Jakou nemovitost?', type: 'select', options: ['Byt', 'Dům', 'Chata/chalupa', 'Více nemovitostí', 'Nevlastním'] },
      { id: 'property_insured', label: 'Máte ji pojištěnou?', type: 'select', options: ['Ano', 'Ne'] },
      { id: 'want_property_insurance', label: 'Přejete si ji pojistit?', type: 'select', options: ['Ano', 'Ne'] },
      { id: 'property_value', label: 'Pokud ano, jakou má hodnotu? (Kč)', type: 'number', placeholder: '3 000 000' },
      { id: 'combined_insurance', label: 'Přejete si pojistit nemovitost i domácnost dohromady?', type: 'select', options: ['Ano', 'Ne'] },
      { id: 'property_notes', label: 'Poznámky', type: 'text', placeholder: 'Další informace...' },
    ],
  },
  {
    id: 'personal',
    title: 'Osobní údaje',
    icon: UserCircle,
    color: 'from-[#162459] to-[#0e1a3d]',
    questions: [
      { id: 'full_name', label: 'Jméno a příjmení', type: 'text', placeholder: 'Jan Novák' },
      { id: 'email', label: 'E-mail', type: 'text', placeholder: 'jan@email.cz' },
      { id: 'phone', label: 'Telefon', type: 'text', placeholder: '+420 777 123 456' },
      { id: 'age', label: 'Věk', type: 'number', placeholder: '35' },
      { id: 'height', label: 'Výška (cm)', type: 'number', placeholder: '178' },
      { id: 'weight', label: 'Váha (kg)', type: 'number', placeholder: '80' },
      { id: 'serious_illness', label: 'Vážné nemoci za posledních 5 let?', type: 'text', placeholder: 'Žádné / popište...' },
      { id: 'injury', label: 'Úraz za posledních 5 let?', type: 'text', placeholder: 'Žádný / popište...' },
      { id: 'occupation', label: 'Jaké je vaše zaměstnání?', type: 'text', placeholder: 'Účetní, řidič, IT...' },
    ],
  },
]

export default function AnalyzaPage() {
  const [data, setData] = useState<Record<string, SectionData>>({})
  const [expandedSections, setExpandedSections] = useState<string[]>([sections[0].id])
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const [activeUploadSection, setActiveUploadSection] = useState('')

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

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return
    const newFiles = Array.from(e.target.files).map(f => ({
      name: f.name,
      size: f.size,
      section: activeUploadSection,
    }))
    setFiles(prev => [...prev, ...newFiles])
    e.target.value = ''
  }

  function removeFile(name: string) {
    setFiles(prev => prev.filter(f => f.name !== name))
  }

  function sectionProgress(sectionId: string): number {
    const section = sections.find(s => s.id === sectionId)
    if (!section) return 0
    const answered = Object.keys(data[sectionId] || {}).filter(k => data[sectionId][k]).length
    return Math.round((answered / section.questions.length) * 100)
  }

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [userId, setUserId] = useState<string | null>(null)
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const supabase = useMemo(() => createClient(), [])

  // Get user ID on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id)
    })
  }, [supabase])

  // Load existing responses
  useEffect(() => {
    if (!userId) return
    fetch(`/api/analysis?clientId=${userId}`)
      .then(res => res.json())
      .then(result => {
        if (result.responses && Object.keys(result.responses).length > 0) {
          setData(result.responses)
        }
      })
      .catch(() => {})
  }, [userId])

  // Auto-save on data change (debounced 2s)
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
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      // Save analysis responses
      try {
        await fetch('/api/analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientId: user.id, responses: data }),
        })
      } catch {}

      // Update profile
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
          <p className="text-xs tracking-[0.3em] uppercase text-[#818EAF] mb-2">Hotovo · poradce je o tom ví</p>
          <h1
            className="font-display text-[#162459] mb-5"
            style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.02em', lineHeight: 1.05 }}
          >
            Analýza <span style={{ fontStyle: 'italic', color: '#009EE2' }}>odeslána</span>.
          </h1>
          <p className="text-[#818EAF] mb-10 max-w-md mx-auto leading-relaxed">
            Váš poradce připraví finanční plán na základě vašich odpovědí. Výsledky obvykle do 48 hodin.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-white text-[15px] transition-all hover:shadow-lg hover:shadow-[#009EE2]/25 hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg, #009EE2, #0088c6)' }}
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
          className="inline-flex items-center gap-1 text-sm text-[#818EAF] hover:text-[#162459] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Zpět
        </Link>
        <div className="section-numeral text-[3rem] md:text-[4.5rem] mb-2">02</div>
        <p className="text-xs tracking-[0.3em] uppercase text-[#818EAF] mb-2">Analýza · o vaší situaci</p>
        <div className="flex items-start justify-between gap-4">
          <h1
            className="font-display text-[#162459]"
            style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.02em', lineHeight: 1.05 }}
          >
            Finanční <span style={{ fontStyle: 'italic', color: '#009EE2' }}>analýza</span>
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
              <span className="text-[#818EAF]">
                {saveStatus === 'saving' ? 'Ukládám…' : saveStatus === 'saved' ? 'Uloženo' : 'Chyba'}
              </span>
            </div>
          )}
        </div>
        <p className="text-[#818EAF] mt-3 max-w-xl leading-relaxed">
          Odpovězte na otázky v jednotlivých sekcích. Čím víc vyplníte, tím přesnější plán dostanete. Průběh se ukládá sám.
        </p>
      </motion.div>

      <div className="space-y-4">
        {sections.map((section, sIdx) => {
          const isExpanded = expandedSections.includes(section.id)
          const progress = sectionProgress(section.id)
          const sectionFiles = files.filter(f => f.section === section.id)

          return (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: sIdx * 0.05 }}
              className="bg-white rounded-3xl border border-[#E8E9EE] overflow-hidden transition-all hover:shadow-[0_10px_30px_-10px_rgba(22,36,89,0.12)]"
            >
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center gap-4 p-5 md:p-6 text-left"
              >
                <div
                  className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${section.color} flex items-center justify-center flex-shrink-0 shadow-sm`}
                >
                  <section.icon className="w-5 h-5 text-white" strokeWidth={1.8} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3
                    className="font-display text-[#162459]"
                    style={{ fontSize: '1.1rem', letterSpacing: '-0.01em' }}
                  >
                    {section.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="w-28 h-1 bg-[#E8E9EE] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${progress}%`,
                          background: 'linear-gradient(90deg, #009EE2, #0088c6)',
                        }}
                      />
                    </div>
                    <span className="text-xs text-[#818EAF] tabular-nums">{progress}%</span>
                  </div>
                </div>
                {progress === 100 && (
                  <div className="w-7 h-7 bg-[#16a34a]/10 border border-[#16a34a]/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-[#15803d]" />
                  </div>
                )}
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-[#818EAF] flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-[#818EAF] flex-shrink-0" />
                )}
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="h-px bg-[#E8E9EE]" />
                    <div className="p-5 md:p-7 space-y-5">
                      {section.questions.map(q => (
                        <div key={q.id}>
                          <label className="block text-xs font-semibold uppercase tracking-[0.15em] text-[#818EAF] mb-2">
                            {q.label}
                          </label>
                          {q.type === 'select' ? (
                            <select
                              value={data[section.id]?.[q.id] || ''}
                              onChange={e => updateField(section.id, q.id, e.target.value)}
                              className="w-full h-11 rounded-xl border border-[#E8E9EE] bg-white px-4 text-[15px] text-[#162459] focus:outline-none focus:border-[#009EE2] focus:ring-4 focus:ring-[#009EE2]/10 transition-all"
                            >
                              <option value="">Vyberte…</option>
                              {q.options?.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          ) : q.type === 'checkbox' ? (
                            <div className="grid grid-cols-2 gap-2 mt-1">
                              {q.options?.map(opt => {
                                const current = (data[section.id]?.[q.id] || '').split(',').filter(Boolean)
                                const checked = current.includes(opt)
                                return (
                                  <label
                                    key={opt}
                                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border cursor-pointer transition-all text-sm ${
                                      checked
                                        ? 'border-[#009EE2] bg-[#009EE2]/8 text-[#0088c6] shadow-[inset_0_0_0_1px_#009EE2]'
                                        : 'border-[#E8E9EE] bg-white text-[#162459] hover:border-[#009EE2]/50'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => {
                                        const next = checked ? current.filter(c => c !== opt) : [...current, opt]
                                        updateField(section.id, q.id, next.join(','))
                                      }}
                                      className="accent-[#009EE2]"
                                    />
                                    {opt}
                                  </label>
                                )
                              })}
                            </div>
                          ) : (
                            <Input
                              type={q.type}
                              placeholder={q.placeholder}
                              value={data[section.id]?.[q.id] || ''}
                              onChange={e => updateField(section.id, q.id, e.target.value)}
                            />
                          )}
                        </div>
                      ))}

                      <div className="h-px bg-[#E8E9EE]" />

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-[0.15em] text-[#818EAF] mb-2">
                          Přílohy (PDF, foto smluv)
                        </label>
                        <button
                          onClick={() => { setActiveUploadSection(section.id); fileRef.current?.click() }}
                          className="w-full border border-dashed border-[#E8E9EE] rounded-2xl p-5 text-center hover:border-[#009EE2] hover:bg-[#009EE2]/5 transition-all group"
                        >
                          <Upload className="w-5 h-5 text-[#818EAF] mx-auto mb-1.5 group-hover:text-[#0088c6]" />
                          <span className="text-sm text-[#818EAF] group-hover:text-[#162459]">
                            Klikněte pro nahrání PDF nebo fotky
                          </span>
                        </button>
                        {sectionFiles.length > 0 && (
                          <div className="mt-2.5 space-y-1.5">
                            {sectionFiles.map(f => (
                              <div
                                key={f.name}
                                className="flex items-center gap-2 bg-[#f8f9fc] rounded-xl px-3 py-2.5 text-sm border border-[#E8E9EE]"
                              >
                                <FileText className="w-4 h-4 text-[#818EAF]" />
                                <span className="flex-1 text-[#162459] truncate">{f.name}</span>
                                <span className="text-xs text-[#818EAF]">{(f.size / 1024).toFixed(0)} KB</span>
                                <button onClick={() => removeFile(f.name)} className="text-[#818EAF] hover:text-[#c2410c]">
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>

      <motion.div
        className="mt-10 flex justify-end"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-white text-[15px] transition-all disabled:opacity-50 hover:shadow-lg hover:shadow-[#009EE2]/25 hover:-translate-y-0.5"
          style={{ background: 'linear-gradient(135deg, #009EE2, #0088c6)' }}
        >
          {loading ? 'Odesílám…' : 'Odeslat analýzu'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </motion.div>
    </div>
  )
}
