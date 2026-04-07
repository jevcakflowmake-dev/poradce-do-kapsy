'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import type { ProposalType } from '@/lib/types/database'

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

export default function ProposalForm({ clientId }: { clientId: string }) {
  const [file, setFile] = useState<File | null>(null)
  const [sending, setSending] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'insurance' },
  })

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

    const { error: insertError } = await supabase.from('proposals').insert({
      client_id: clientId,
      type: data.type,
      title: data.title,
      content: data.content || null,
      file_url,
      link_url: data.link_url || null,
    })

    if (insertError) {
      setError('Chyba při odesílání: ' + insertError.message)
    } else {
      setSuccess(true)
      reset()
      setFile(null)
      setTimeout(() => {
        setSuccess(false)
        window.location.reload()
      }, 2000)
    }

    setSending(false)
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h2 className="font-semibold text-slate-900 mb-4">Odeslat návrh</h2>

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
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Typ návrhu</label>
          <div className="flex gap-2">
            {PROPOSAL_TYPES.map(t => (
              <label key={t.value} className="flex-1">
                <input {...register('type')} type="radio" value={t.value} className="sr-only" />
                <span className="block text-center py-2 text-xs font-medium border border-slate-200 rounded-lg cursor-pointer transition-all has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50 has-[:checked]:text-blue-700">
                  {t.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Název návrhu</label>
          <input
            {...register('title')}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Návrh životního pojištění"
          />
          {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Textový popis (volitelné)</label>
          <textarea
            {...register('content')}
            rows={3}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Popis návrhu pro klienta..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">PDF dokument (volitelné)</label>
          <input
            type="file"
            accept=".pdf"
            onChange={e => setFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {file && <p className="mt-1 text-xs text-slate-500">{file.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Odkaz (volitelné)</label>
          <input
            {...register('link_url')}
            type="url"
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://..."
          />
          {errors.link_url && <p className="mt-1 text-xs text-red-600">{errors.link_url.message}</p>}
        </div>

        <button
          type="submit"
          disabled={sending}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
        >
          {sending ? 'Odesílám...' : 'Odeslat návrh'}
        </button>
      </form>
    </div>
  )
}
