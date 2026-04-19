'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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

  // Insurance-specific state
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

    // Upload PDF pokud existuje
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

    // Build content for insurance type
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

      // Notify client via n8n webhook
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
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h2 className="font-semibold text-[#162459] mb-4">Odeslat návrh</h2>

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          Návrh byl úspěšně odeslán
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Type selector */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Typ návrhu</label>
          <div className="flex gap-2">
            {PROPOSAL_TYPES.map(t => (
              <label key={t.value} className="flex-1">
                <input {...register('type')} type="radio" value={t.value} className="sr-only peer" />
                <span className="block text-center py-2 text-xs font-medium border border-slate-200 rounded-lg cursor-pointer transition-all peer-checked:border-[#009EE2] peer-checked:bg-[#009EE2]/10 peer-checked:text-[#162459]">
                  {t.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Název návrhu</label>
          <input
            {...register('title')}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#009EE2]"
            placeholder={selectedType === 'insurance' ? 'Návrh životního pojištění' : selectedType === 'pension' ? 'Návrh penzijního plánu' : 'Investiční návrh'}
          />
          {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
        </div>

        {/* Insurance-specific fields */}
        {selectedType === 'insurance' && (
          <>
            {/* Company selector */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Pojišťovna</label>
              <div className="grid grid-cols-4 gap-2">
                {INSURANCE_LOGOS.map(company => (
                  <button
                    key={company.id}
                    type="button"
                    onClick={() => setSelectedCompany(company.id)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all text-center ${
                      selectedCompany === company.id
                        ? 'border-[#009EE2] bg-[#009EE2]/10 shadow-sm'
                        : 'border-slate-200 hover:border-[#818EAF] bg-white'
                    }`}
                  >
                    <span className="text-xl">{company.emoji}</span>
                    <span className="text-xs font-medium text-[#162459]">{company.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Monthly price */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Měsíční cena pojištění</label>
              <div className="relative">
                <input
                  type="number"
                  value={monthlyPrice}
                  onChange={e => setMonthlyPrice(e.target.value)}
                  className="w-full px-3 py-2 pr-20 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#009EE2]"
                  placeholder="1 500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#818EAF] font-medium">Kč/měsíc</span>
              </div>
            </div>

            {/* Insurance sections */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Sekce pojištění</label>
              <div className="space-y-2">
                {INSURANCE_SECTIONS.map(section => (
                  <div
                    key={section.id}
                    className={`rounded-xl border transition-all ${
                      enabledSections[section.id]
                        ? 'border-[#009EE2] bg-[#009EE2]/5'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3 p-3">
                      <input
                        type="checkbox"
                        checked={!!enabledSections[section.id]}
                        onChange={() => toggleInsuranceSection(section.id)}
                        className="rounded border-slate-300 text-[#009EE2] focus:ring-[#009EE2] w-4 h-4"
                      />
                      <span className="text-sm font-medium text-[#162459] flex-1">{section.label}</span>
                      {enabledSections[section.id] && (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={sectionAmounts[section.id] || ''}
                            onChange={e => updateSectionAmount(section.id, e.target.value)}
                            className="w-28 px-2 py-1.5 border border-slate-200 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-[#009EE2]"
                            placeholder="0"
                          />
                          <span className="text-xs text-[#818EAF] font-medium whitespace-nowrap w-16">{section.unit}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Text description */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Textový popis (volitelné)</label>
          <textarea
            {...register('content')}
            rows={3}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#009EE2] resize-none"
            placeholder="Popis návrhu pro klienta..."
          />
        </div>

        {/* PDF upload */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">PDF dokument (volitelné)</label>
          <input
            type="file"
            accept=".pdf"
            onChange={e => setFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#009EE2]/10 file:text-[#162459] hover:file:bg-[#009EE2]/20"
          />
          {file && <p className="mt-1 text-xs text-slate-500">{file.name}</p>}
        </div>

        {/* Link */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Odkaz (volitelné)</label>
          <input
            {...register('link_url')}
            type="url"
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#009EE2]"
            placeholder="https://..."
          />
          {errors.link_url && <p className="mt-1 text-xs text-red-600">{errors.link_url.message}</p>}
        </div>

        <button
          type="submit"
          disabled={sending}
          className="w-full py-2.5 bg-[#162459] hover:bg-[#162459]/90 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
        >
          {sending ? 'Odesílám...' : 'Odeslat návrh'}
        </button>
      </form>
    </div>
  )
}
