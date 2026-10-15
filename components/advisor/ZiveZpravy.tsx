'use client'

import { useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/** Víc změn naráz (pět zpráv označených jako přečtené) = jedno načtení stránky. */
const PRODLEVA_OBNOVY = 400

/**
 * Živé zprávy pro celý panel poradce: poslouchá změny v tabulce zpráv a řekne
 * aktuální stránce, ať se načte znovu. Tím se naráz srovná odznak u Zpráv
 * v navigaci, „K vyřízení“, seznam konverzací i odznaky u klientů.
 * Nic nevykresluje – sedí v rozložení sekcí panelu.
 */
export default function ZiveZpravy() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    let kanal: ReturnType<typeof supabase.channel> | null = null
    let zruseno = false
    let casovac: ReturnType<typeof setTimeout> | null = null

    const obnov = () => {
      if (casovac) clearTimeout(casovac)
      casovac = setTimeout(() => router.refresh(), PRODLEVA_OBNOVY)
    }

    async function pripojSe() {
      // Bez tokenu na socketu se odběr tváří jako anonym a žádná změna
      // nedorazí – stejná past jako v ChatWindow.
      const { data: { session } } = await supabase.auth.getSession()
      if (zruseno) return
      await supabase.realtime.setAuth(session?.access_token)
      if (zruseno) return

      kanal = supabase
        .channel('panel-zpravy')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, obnov)
        .subscribe()
    }
    pripojSe()

    // Záložka v pozadí může o spojení přijít. Po návratu se panel dorovná,
    // i kdyby mezitím nějaká změna nedorazila.
    const poNavratu = () => {
      if (document.visibilityState === 'visible') obnov()
    }
    document.addEventListener('visibilitychange', poNavratu)

    return () => {
      zruseno = true
      if (casovac) clearTimeout(casovac)
      document.removeEventListener('visibilitychange', poNavratu)
      if (kanal) supabase.removeChannel(kanal)
    }
  }, [router, supabase])

  return null
}
