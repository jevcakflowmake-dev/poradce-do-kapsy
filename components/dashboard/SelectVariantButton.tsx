'use client'

import { useState } from 'react'
import { Check, Loader2, Heart } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Props = {
  clientId: string
  variantId: string
  company: string
  section: string
  isSelected: boolean
  onToggle: (selected: boolean) => void
}

const WEBHOOK_URL = 'https://n8n.jevcakn8n.com/webhook/klient-zajem'

export default function SelectVariantButton({
  clientId,
  variantId,
  company,
  section,
  isSelected,
  onToggle,
}: Props) {
  const [loading, setLoading] = useState(false)

  async function handleClick(e: React.MouseEvent) {
    e.stopPropagation() // nechceme collapse trigger
    if (loading) return
    setLoading(true)

    const supabase = createClient()

    if (isSelected) {
      const { error } = await supabase
        .from('plan_variant_selection')
        .delete()
        .eq('client_id', clientId)
        .eq('variant_id', variantId)
      if (!error) onToggle(false)
    } else {
      const { error } = await (supabase.from('plan_variant_selection') as any).insert({
        client_id: clientId,
        variant_id: variantId,
      })
      if (!error) {
        onToggle(true)
        try {
          fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event: 'variant_selected',
              client_id: clientId,
              variant_id: variantId,
              company,
              section,
              created_at: new Date().toISOString(),
            }),
          })
        } catch {}
      }
    }
    setLoading(false)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-60 ${
        isSelected
          ? 'bg-[#009EE2] text-white shadow-sm shadow-[#009EE2]/25 hover:bg-[#0088c6]'
          : 'bg-white border border-[#009EE2]/40 text-[#0088c6] hover:bg-[#009EE2]/5 hover:border-[#009EE2]'
      }`}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : isSelected ? (
        <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
      ) : (
        <Heart className="w-3.5 h-3.5" strokeWidth={2} />
      )}
      {isSelected ? 'Vybráno' : 'Vybrat variantu'}
    </button>
  )
}
