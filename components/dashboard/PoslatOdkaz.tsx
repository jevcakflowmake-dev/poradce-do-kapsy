'use client'

import { useState } from 'react'
import { Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Odkaz na analýzu pro známé. Na telefonu otevře nabídku sdílení (zpráva,
 * WhatsApp…), kde ji prohlížeč nemá, odkaz zkopíruje. Když selže i to,
 * ukáže ho aspoň jako text.
 */
export default function PoslatOdkaz({ odkaz }: { odkaz: string }) {
  const [stav, setStav] = useState<'nic' | 'zkopirovano' | 'chyba'>('nic')

  async function poslat() {
    const sdileni = { title: 'Poradce do kapsy – finanční analýza zdarma', url: odkaz }
    if (typeof navigator.share === 'function' && (navigator.canShare?.(sdileni) ?? true)) {
      try {
        await navigator.share(sdileni)
        return
      } catch (err) {
        // Zavřená nabídka sdílení není chyba.
        if (err instanceof DOMException && err.name === 'AbortError') return
      }
    }
    try {
      await navigator.clipboard.writeText(odkaz)
      setStav('zkopirovano')
    } catch {
      setStav('chyba')
    }
  }

  return (
    <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
      <Button type="button" variant="outline" size="sm" onClick={poslat}>
        <Share2 className="w-4 h-4" aria-hidden /> Poslat odkaz na analýzu
      </Button>
      <span role="status" className="text-base text-slate">
        {stav === 'zkopirovano' && 'Odkaz je zkopírovaný, stačí ho vložit do zprávy.'}
        {stav === 'chyba' && `Odkaz: ${odkaz}`}
      </span>
    </div>
  )
}
