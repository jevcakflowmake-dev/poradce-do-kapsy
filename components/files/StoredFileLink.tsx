'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Props = {
  bucket: 'analysis' | 'proposals'
  /** Storage cesta; starší záznamy mohou obsahovat plné http URL – ty pustíme rovnou. */
  path: string
  children: React.ReactNode
  className?: string
}

/**
 * Odkaz na soubor v privátním bucketu – signed URL se generuje až na klik,
 * takže nikdy nevyprší „pod rukama“ a stránka nedělá N požadavků při načtení.
 */
export default function StoredFileLink({ bucket, path, children, className }: Props) {
  const [loading, setLoading] = useState(false)

  async function open() {
    if (path.startsWith('http')) {
      window.open(path, '_blank', 'noopener,noreferrer')
      return
    }
    // Okno se otevírá hned při kliknutí: Safari (hlavně na iPhonu) okno
    // otevřené až po čekání na odkaz zablokuje jako vyskakovací.
    const okno = window.open('', '_blank')
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60)
    setLoading(false)
    if (error || !data?.signedUrl) {
      okno?.close()
      alert('Soubor se nepodařilo otevřít. Zkuste to prosím znovu.')
      return
    }
    if (okno) {
      okno.opener = null
      okno.location.href = data.signedUrl
    } else {
      // Prohlížeč okno zablokoval úplně – otevřeme soubor v téhle záložce.
      window.location.href = data.signedUrl
    }
  }

  return (
    <button type="button" onClick={open} disabled={loading} className={className}>
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : children}
    </button>
  )
}
