'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Maximize2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import ChatWindow from '@/components/chat/ChatWindow'
import type { Konverzace } from '@/lib/konverzace'
import { plural } from '@/lib/utils'

/** Víc změn naráz (pět zpráv označených jako přečtené) = jedno načtení stránky. */
const PRODLEVA_OBNOVY = 400

const pocetNeprectenych = (n: number) => `${n} ${plural(n, 'nepřečtená zpráva', 'nepřečtené zprávy', 'nepřečtených zpráv')}`

function Odznak({ pocet }: { pocet: number }) {
  return (
    <span
      aria-hidden
      className="shrink-0 bg-danger text-white text-xs font-bold rounded-pill min-w-5 h-5 px-1.5 inline-flex items-center justify-center tabular-nums"
    >
      {pocet}
    </span>
  )
}

/**
 * Zprávy na úvodní stránce poradce: kdo psal naposled, kolik zpráv čeká,
 * a konverzace se otevře přímo tady.
 *
 * Seznam drží server. Tahle komponenta jen poslouchá změny v tabulce zpráv
 * a řekne stránce, ať se načte znovu – tím se naráz srovná i „K vyřízení“
 * a odznaky v seznamu klientů, které počítají totéž.
 */
export default function PrehledZprav({ konverzace }: { konverzace: Konverzace[] }) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [otevrena, setOtevrena] = useState<string | null>(null)
  const zpetRef = useRef<HTMLButtonElement>(null)
  const seznamRef = useRef<HTMLUListElement>(null)
  const vratFokus = useRef<string | null>(null)

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
        .channel('prehled-zprav')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, obnov)
        .subscribe()
    }
    pripojSe()

    // Záložka v pozadí může o spojení přijít. Po návratu se přehled dorovná,
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

  // Seznam a konverzace se střídají na jednom místě, takže prvek, na který
  // se kliklo, zmizí. Fokus proto předáváme ručně, ať nespadne na začátek stránky.
  useEffect(() => {
    if (otevrena) {
      zpetRef.current?.focus()
      return
    }
    const id = vratFokus.current
    if (!id) return
    vratFokus.current = null
    seznamRef.current?.querySelector<HTMLElement>(`[data-klient="${id}"]`)?.focus()
  }, [otevrena])

  const vybrana = konverzace.find((k) => k.klientId === otevrena) ?? null
  // Otevřenou konverzaci právě čtu – chat si její zprávy označí sám.
  const neprectene = (k: Konverzace) => (k.klientId === vybrana?.klientId ? 0 : k.neprectene)
  const celkem = konverzace.reduce((soucet, k) => soucet + neprectene(k), 0)

  function zavri() {
    vratFokus.current = otevrena
    setOtevrena(null)
  }

  return (
    <section aria-labelledby="zpravy-nadpis" className="rounded-card border border-line bg-surface overflow-hidden">
      <h2 id="zpravy-nadpis" className="font-display text-navy text-h3 flex items-center gap-2 px-5 md:px-6 pt-5 md:pt-6 pb-4">
        Zprávy
        {celkem > 0 && (
          <>
            <Odznak pocet={celkem} />
            <span className="sr-only">{pocetNeprectenych(celkem)}</span>
          </>
        )}
      </h2>

      {konverzace.length === 0 ? (
        <p className="px-5 md:px-6 pb-5 md:pb-6 text-base text-slate text-pretty">
          Zatím vám nikdo nenapsal. Nová zpráva se tu ukáže sama, stránku není potřeba obnovovat. Klientovi napíšete
          přes ikonu chatu v seznamu níže.
        </p>
      ) : vybrana ? (
        <div className="border-t border-line flex flex-col h-[30rem] max-h-[75dvh]">
          <div className="shrink-0 flex items-center gap-1 px-2 py-1 border-b border-line">
            <button
              ref={zpetRef}
              type="button"
              onClick={zavri}
              className="inline-flex items-center gap-1.5 h-11 px-3 rounded-pill text-sm font-semibold text-navy hover:bg-cream focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden /> Zpět
            </button>
            <Link
              href={`/advisor/${vybrana.klientId}`}
              className="min-w-0 flex-1 truncate px-1 font-semibold text-navy rounded-pill hover:underline underline-offset-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40"
            >
              {vybrana.jmeno}
            </Link>
            <Link
              href={`/advisor/${vybrana.klientId}/chat`}
              aria-label={`Otevřít chat s klientem ${vybrana.jmeno} na celou stránku`}
              title="Na celou stránku"
              className="shrink-0 inline-flex items-center justify-center w-11 h-11 rounded-pill text-slate hover:text-navy hover:bg-cream focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40"
            >
              <Maximize2 className="w-4 h-4" aria-hidden />
            </Link>
          </div>
          <div className="flex-1 min-h-0 flex flex-col">
            <ChatWindow key={vybrana.klientId} clientId={vybrana.klientId} myRole="advisor" />
          </div>
        </div>
      ) : (
        <ul ref={seznamRef} className="border-t border-line divide-y divide-line max-h-[22rem] overflow-y-auto">
          {konverzace.map((k) => {
            const ceka = neprectene(k)
            return (
              <li key={k.klientId}>
                <button
                  type="button"
                  data-klient={k.klientId}
                  onClick={() => setOtevrena(k.klientId)}
                  className="w-full text-left flex items-center gap-3 px-5 md:px-6 py-3.5 transition-colors hover:bg-cream focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-mint/40"
                >
                  <span
                    aria-hidden
                    className="w-9 h-9 shrink-0 rounded-pill bg-navy text-cream text-sm font-bold flex items-center justify-center"
                  >
                    {(k.jmeno.match(/\p{L}/u)?.[0] ?? 'K').toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline gap-2">
                      <span className={`truncate text-base text-navy ${ceka > 0 ? 'font-bold' : 'font-semibold'}`}>{k.jmeno}</span>
                      <span className="ml-auto shrink-0 text-sm text-slate tabular-nums">{k.posledni.cas}</span>
                    </span>
                    <span className="mt-0.5 flex items-center gap-2">
                      <span className={`truncate text-base ${ceka > 0 ? 'text-navy font-medium' : 'text-slate'}`}>
                        {k.posledni.odPoradce && 'Vy: '}
                        {k.posledni.text}
                      </span>
                      {ceka > 0 && (
                        <span className="ml-auto inline-flex">
                          <Odznak pocet={ceka} />
                          <span className="sr-only">{pocetNeprectenych(ceka)}</span>
                        </span>
                      )}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
