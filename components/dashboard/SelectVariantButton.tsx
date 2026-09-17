'use client'

import { useState } from 'react'
import { Check, Loader2, Heart } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { notifyAdvisor } from '@/lib/notify'

type Props = {
  clientId: string
  variantId: string
  company: string
  section: string
  isSelected: boolean
  onToggle: (selected: boolean) => void
}


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
      const { error } = await supabase.from('plan_variant_selection').insert({
        client_id: clientId,
        variant_id: variantId,
      })
      if (!error) {
        onToggle(true)
        notifyAdvisor({
          event: 'variant_selected',
          client_id: clientId,
          variant_id: variantId,
          company,
          section,
        })
      }
    }
    setLoading(false)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-card text-xs font-semibold transition-all disabled:opacity-60 ${
        isSelected
          ? 'bg-mint text-navy hover:bg-mint-dark'
          : 'bg-surface border border-mint/40 text-navy hover:bg-mint/5 hover:border-mint'
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
