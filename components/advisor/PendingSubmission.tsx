'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Check, Loader2, X } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { SECTIONS } from '@/lib/analysis-sections'

interface Props {
  submissionId: string
  createdAt: string
  email: string
  responses: Record<string, Record<string, string>>
  fileCount: number
}

/**
 * Analýza, kterou z veřejného formuláře poslal někdo s e-mailem tohoto
 * klienta. Nepřepisujeme ji automaticky – odeslat formulář s cizím e-mailem
 * může kdokoliv a jsou v něm zdravotní údaje. Rozhoduje poradce.
 */
export default function PendingSubmission({
  submissionId,
  createdAt,
  email,
  responses,
  fileCount,
}: Props) {
  const [busy, setBusy] = useState<'apply' | 'discard' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)
  const router = useRouter()

  const answered = Object.values(responses).reduce(
    (n, section) => n + Object.values(section).filter(Boolean).length,
    0,
  )

  async function decide(action: 'apply' | 'discard') {
    setBusy(action)
    setError(null)
    try {
      const res = await fetch('/api/advisor/submission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submission_id: submissionId, action }),
      })
      const payload = await res.json()
      if (!res.ok) {
        setError(payload.error || 'Akce se nezdařila.')
        setBusy(null)
        return
      }
      router.refresh()
    } catch {
      setError('Chyba připojení. Zkuste to prosím znovu.')
      setBusy(null)
    }
  }

  return (
    <div className="mb-8 bg-[#FDFCF8] border border-[#E4DFD2] border-l-2 border-l-[#f59e0b]">
      <div className="p-5 md:p-6">
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle className="w-5 h-5 text-[#f59e0b] shrink-0 mt-0.5" strokeWidth={1.8} />
          <div className="min-w-0">
            <h3
              className="font-display text-[#162459] mb-1"
              style={{ fontSize: '1.15rem', letterSpacing: '-0.01em' }}
            >
              Nová analýza z veřejného formuláře
            </h3>
            <p className="text-sm text-[#66708C] leading-relaxed">
              {formatDate(createdAt)} přišla analýza na e-mail <strong className="text-[#162459]">{email}</strong>,
              který už u nás účet má – {answered} vyplněných odpovědí
              {fileCount > 0 && `, ${fileCount} ${fileCount === 1 ? 'příloha' : fileCount < 5 ? 'přílohy' : 'příloh'}`}.
              Odpovědi zatím nikam nezapsané: přijetím přepíšou dosavadní analýzu klienta.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          className="text-sm text-[#0079AD] hover:text-[#162459] underline underline-offset-2 transition-colors"
        >
          {expanded ? 'Skrýt odpovědi' : 'Zobrazit, co přišlo'}
        </button>

        {expanded && (
          <div className="mt-4 space-y-4 max-h-96 overflow-y-auto pr-1">
            {SECTIONS.map(section => {
              const answers = responses[section.id]
              if (!answers || Object.keys(answers).length === 0) return null
              return (
                <div key={section.id}>
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#66708C] mb-2">
                    {section.title}
                  </p>
                  <dl className="space-y-1.5">
                    {section.questions.map(q => {
                      const value = answers[q.id]
                      if (!value) return null
                      return (
                        <div key={q.id} className="flex gap-3 text-sm">
                          <dt className="text-[#66708C] flex-1 min-w-0">{q.label}</dt>
                          <dd className="text-[#162459] font-medium text-right shrink-0 max-w-[45%] break-words">
                            {value}
                          </dd>
                        </div>
                      )
                    })}
                  </dl>
                </div>
              )
            })}
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-[rgba(234,88,12,0.08)] border border-[rgba(234,88,12,0.3)] text-sm text-[#c2410c]">
            {error}
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => decide('apply')}
            disabled={busy !== null}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-none font-semibold text-white text-sm transition-all disabled:opacity-50 hover:shadow-lg hover:shadow-[#009EE2]/25"
            style={{ background: '#162459' }}
          >
            {busy === 'apply' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Přijmout a přepsat analýzu
          </button>
          <button
            type="button"
            onClick={() => decide('discard')}
            disabled={busy !== null}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-none border border-[#E4DFD2] text-[#162459] text-sm hover:border-[#c2410c] hover:text-[#c2410c] transition-colors disabled:opacity-50"
          >
            {busy === 'discard' ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
            Zahodit
          </button>
        </div>
      </div>
    </div>
  )
}
