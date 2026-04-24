'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowUpRight, CheckCircle2, AlertCircle, Upload, Link2, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { ProposalType } from '@/lib/types/database'

const INSURANCE_SECTIONS = [
  { id: 'daily_compensation', label: 'Denní odškodné', unit: 'Kč/den' },
  { id: 'hospitalization', label: 'Hospitalizace', unit: 'Kč/den' },
  { id: 'disability', label: 'Invalidita', unit: 'Kč' },
  { id: 'permanent_consequences', label: 'Trvalé následky', unit: 'Kč' },
  { id: 'serious_illness', label: 'Závažná onemocnění', unit: 'Kč' },
  { id: 'work_incapacity', label: 'Pracovní neschopnost', unit: 'Kč/den' },
  { id: 'death', label: 'Smrt', unit: 'Kč' },
  { id: 'death_accident', label: 'Smrt úrazem', unit: 'Kč' },
  { id: 'long_term_care', label: 'Dlouhodobá péče', unit: 'Kč/měsíc' },
]

const INSURANCE_LOGOS = [
  { id: 'cpp', name: 'ČPP', emoji: '🔵' },
  { id: 'kooperativa', name: 'Kooperativa', emoji: '🟢' },
  { id: 'allianz', name: 'Allianz', emoji: '🔷' },
  { id: 'metlife', name: 'MetLife', emoji: '🟣' },
  { id: 'generali', name: 'Generali', emoji: '🔴' },
  { id: 'nn', name: 'NN', emoji: '🟠' },
  { id: 'uniqa', name: 'UNIQA', emoji: '🟡' },
  { id: 'other', name: 'Jiná', emoji: '⚪' },
]

const schema = z.object({
  type: z.enum(['insurance', 'pension', 'invest']),
  title: z.string().min(3, 'Zadejte název návrhu'),
  content: z.string().optional(),
  link_url: z.string().url('Zadejte platnou URL').optional().or(z.literal('')),
})

type FormData = z.infer<typeof schema>

const PROPOSAL_TYPES: { value: ProposalType; label: string }[] = [
  { value: 'insurance', label: 'Pojištění' },
  { value: 'pension', label: 'Důchod' },
  { value: 'invest', label: 'Investice' },
]

interface InsuranceSection {
  id: string
  amount: number
}

export default function ProposalForm({ clientId }: { clientId: string }) {
  const [file, setFile] = useState<File | null>(null)
  const [sending, setSending] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [selectedCompany, setSelectedCompany] = useState<string | null>(null)
  const [monthlyPrice, setMonthlyPrice] = useState<string>('')
  const [enabledSections, setEnabledSections] = useState<Record<string, boolean>>({})
  const [sectionAmounts, setSectionAmounts] = useState<Record<string, string>>({})

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'insurance' },
  })

  const selectedType = watch('type')

  function toggleInsuranceSection(sectionId: string) {
    setEnabledSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }))
  }

  function updateSectionAmount(sectionId: string, value: string) {
    setSectionAmounts(prev => ({ ...prev, [sectionId]: value }))
  }

  async function onSubmit(data: FormData) {
    setSending(true)
    setError(null)
    const supabase = createClient()

    let file_url: string | null = null

    if (file) {
      const path = `${clientId}/${Date.now()}_${file.name}`
      const { error: uploadError } = await supabase.storage
        .from('proposals')
        .upload(path, file)

      if (uploadError) {
        setError('Chyba při nahrávání souboru: ' + uploadError.message)
        setSending(false)
        return
      }

      const { data: urlData } = supabase.storage.from('proposals').getPublicUrl(path)
      file_url = urlData.publicUrl
    }

    let contentToSave = data.content || null
    if (data.type === 'insurance') {
      const company = INSURANCE_LOGOS.find(c => c.id === selectedCompany)
      const sections: InsuranceSection[] = INSURANCE_SECTIONS
        .filter(s => enabledSections[s.id])
        .map(s => ({ id: s.id, amount: Number(sectionAmounts[s.id]) || 0 }))

      const insuranceData = {
        sections,
        company: selectedCompany || null,
        logo: company?.emoji || null,
        monthly_price: Number(monthlyPrice) || 0,
        description: data.content || null,
      }
      contentToSave = JSON.stringify(insuranceData)
    }

    const { error: insertError } = await supabase.from('proposals').insert({
      client_id: clientId,
      type: data.type,
      title: data.title,
      content: contentToSave,
      file_url,
      link_url: data.link_url || null,
    })

    if (insertError) {
      setError('Chyba při odesílání: ' + insertError.message)
    } else {
      setSuccess(true)
      reset()
      setFile(null)
      setSelectedCompany(null)
      setMonthlyPrice('')
      setEnabledSections({})
      setSectionAmounts({})

      try {
        fetch('https://n8n.jevcakn8n.com/webhook/novy-navrh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: clientId,
            type: data.type,
            title: data.title,
            created_at: new Date().toISOString(),
          }),
        })
      } catch {}

      setTimeout(() => {
        setSuccess(false)
        window.location.reload()
      }, 2000)
    }

    setSending(false)
  }

  return (
    <div className="bg-white rounded-3xl border border-[#E8E9EE] p-6 md:p-7">
      <div className="mb-5">
        <p className="text-xs tracking-[0.25em] uppercase text-[#818EAF] mb-1.5">
          Návrh · pro klienta
        </p>
        <h2
          className="font-display text-[#162459]"
          style={{ fontSize: 'clamp(1.25rem, 2vw, 1.5rem)', letterSpacing: '-0.01em' }}
        >
          Odeslat <span style={{ fontStyle: 'italic', color: '#009EE2' }}>návrh</span>
        </h2>
      </div>

      {success && (
        <div className="mb-4 p-3.5 rounded-xl bg-[#16a34a]/8 border border-[#16a34a]/25 flex items-center gap-2.5 text-sm text-[#15803d]">
          <CheckCircle2 className="w-4 h-4 shrink-0" strokeWidth={2} />
          Návrh byl úspěšně odeslán
        </div>
      )}
      {error && (
        <div className="mb-4 p-3.5 rounded-xl bg-[rgba(234,88,12,0.08)] border border-[rgba(234,88,12,0.3)] flex items-start gap-2.5 text-sm text-[#c2410c]">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={2} />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Field label="Typ návrhu">
          <div className="grid grid-cols-3 gap-2">
            {PROPOSAL_TYPES.map(t => (
              <label key={t.value} className="cursor-pointer">
                <input {...register('type')} type="radio" value={t.value} className="sr-only peer" />
                <span className="block text-center py-2.5 text-[13px] font-medium border border-[#E8E9EE] rounded-xl transition-all hover:border-[#009EE2]/50 text-[#818EAF] peer-checked:border-[#009EE2] peer-checked:bg-[#009EE2]/8 peer-checked:text-[#162459] peer-checked:shadow-[inset_0_0_0_1px_#009EE2]">
                  {t.label}
                </span>
              </label>
            ))}
          </div>
        </Field>

        <Field label="Název návrhu" error={errors.title?.message}>
          <input
            {...register('title')}
            className={inputClass}
            placeholder={
              selectedType === 'insurance'
                ? 'Návrh životního pojištění'
                : selectedType === 'pension'
                ? 'Návrh penzijního plánu'
                : 'Investiční návrh'
            }
          />
        </Field>

        {selectedType === 'insurance' && (
          <>
            <Field label="Pojišťovna">
              <div className="grid grid-cols-4 gap-2">
                {INSURANCE_LOGOS.map(company => (
                  <button
                    key={company.id}
                    type="button"
                    onClick={() => setSelectedCompany(company.id)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all text-center ${
                      selectedCompany === company.id
                        ? 'border-[#009EE2] bg-[#009EE2]/8 shadow-[inset_0_0_0_1px_#009EE2]'
                        : 'border-[#E8E9EE] bg-white hover:border-[#818EAF]/40'
                    }`}
                  >
                    <span className="text-xl">{company.emoji}</span>
                    <span className="text-[11px] font-medium text-[#162459]">{company.name}</span>
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Měsíční cena pojištění">
              <div className="relative">
                <input
                  type="number"
                  value={monthlyPrice}
                  onChange={e => setMonthlyPrice(e.target.value)}
                  className={`${inputClass} pr-24`}
                  placeholder="1 500"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#818EAF]">
                  Kč / měs
                </span>
              </div>
            </Field>

            <Field label="Sekce pojištění">
              <div className="space-y-2">
                {INSURANCE_SECTIONS.map(section => {
                  const enabled = !!enabledSections[section.id]
                  return (
                    <div
                      key={section.id}
                      className={`rounded-xl border transition-all ${
                        enabled
                          ? 'border-[#009EE2] bg-[#009EE2]/5 shadow-[inset_0_0_0_1px_#009EE2]'
                          : 'border-[#E8E9EE] bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3 px-4 py-3">
                        <input
                          type="checkbox"
                          checked={enabled}
                          onChange={() => toggleInsuranceSection(section.id)}
                          className="w-4 h-4 rounded border-[#E8E9EE] text-[#009EE2] focus:ring-[#009EE2] accent-[#009EE2]"
                        />
                        <span className="text-sm font-medium text-[#162459] flex-1">
                          {section.label}
                        </span>
                        {enabled && (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={sectionAmounts[section.id] || ''}
                              onChange={e => updateSectionAmount(section.id, e.target.value)}
                              className="w-28 px-3 py-1.5 border border-[#E8E9EE] rounded-lg text-sm text-right text-[#162459] bg-white focus:outline-none focus:border-[#009EE2] focus:ring-2 focus:ring-[#009EE2]/15 transition-all"
                              placeholder="0"
                            />
                            <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#818EAF] whitespace-nowrap w-16">
                              {section.unit}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </Field>
          </>
        )}

        <Field label="Textový popis (volitelné)">
          <textarea
            {...register('content')}
            rows={3}
            className={`${inputClass} !h-auto py-3 resize-none leading-relaxed`}
            placeholder="Popis návrhu pro klienta…"
          />
        </Field>

        <Field label="PDF dokument (volitelné)">
          <label className="relative flex items-center gap-3 px-4 py-3.5 rounded-xl border border-dashed border-[#E8E9EE] hover:border-[#009EE2]/50 bg-[#f8f9fc] cursor-pointer transition-all group">
            <div className="w-10 h-10 rounded-xl bg-[#009EE2]/10 flex items-center justify-center shrink-0">
              <Upload className="w-4 h-4 text-[#0088c6]" strokeWidth={1.8} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-[#162459] font-medium truncate">
                {file ? file.name : 'Vybrat PDF soubor'}
              </div>
              <div className="text-xs text-[#818EAF] mt-0.5">
                {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Max. 10 MB'}
              </div>
            </div>
            <input
              type="file"
              accept=".pdf"
              onChange={e => setFile(e.target.files?.[0] ?? null)}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </label>
        </Field>

        <Field label="Odkaz (volitelné)" error={errors.link_url?.message}>
          <div className="relative">
            <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#818EAF]" strokeWidth={1.8} />
            <input
              {...register('link_url')}
              type="url"
              className={`${inputClass} pl-11`}
              placeholder="https://…"
            />
          </div>
        </Field>

        <button
          type="submit"
          disabled={sending}
          className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white text-[15px] transition-all disabled:opacity-50 hover:shadow-lg hover:shadow-[#009EE2]/25 hover:-translate-y-0.5"
          style={{ background: 'linear-gradient(135deg, #009EE2, #0088c6)' }}
        >
          {sending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Odesílám…
            </>
          ) : (
            <>
              Odeslat návrh <ArrowUpRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  )
}

const inputClass =
  'w-full h-11 px-4 rounded-xl border border-[#E8E9EE] bg-white text-[#162459] text-[15px] placeholder:text-[#818EAF] focus:outline-none focus:border-[#009EE2] focus:ring-4 focus:ring-[#009EE2]/10 transition-all'

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#818EAF] mb-2">
        {label}
      </label>
      {children}
      {error && <p className="mt-1.5 text-xs text-[#c2410c]">{error}</p>}
    </div>
  )
}
