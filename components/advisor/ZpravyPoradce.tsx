'use client'

import { useEffect, useId, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowUpRight, MessageCircle } from 'lucide-react'
import ChatWindow from '@/components/chat/ChatWindow'
import RadekKonverzace from '@/components/advisor/RadekKonverzace'
import type { Konverzace } from '@/lib/konverzace'

/**
 * Zprávy v panelu poradce: seznam konverzací a otevřená konverzace.
 * Na počítači vedle sebe, na telefonu se střídají na jednom místě.
 *
 * Otevřená konverzace je v adrese (?klient=…), takže na ni jde odkázat
 * z Přehledu, z K vyřízení i z detailu klienta. Adresa se mění přes
 * history.replaceState – stránka se kvůli tomu znovu nenačítá.
 *
 * Seznam drží server a živě ho obnovuje ZiveZpravy v rozložení panelu.
 * Otevřenou konverzaci chat označí jako přečtenou sám.
 */
export default function ZpravyPoradce({
  konverzace,
  klienti,
  vybrany,
}: {
  konverzace: Konverzace[]
  /** Všichni klienti – komukoli jde napsat, i když spolu ještě nepsali. */
  klienti: Array<{ id: string; jmeno: string }>
  vybrany: string | null
}) {
  const uid = useId()
  const [otevrena, setOtevrena] = useState<string | null>(vybrany)
  const zpetRef = useRef<HTMLButtonElement>(null)
  const seznamRef = useRef<HTMLUListElement>(null)
  const vratFokus = useRef<string | null>(null)

  // Konverzace, kterou poradce teprve začíná, v seznamu ještě není – ukážeme ji nahoře.
  const nova =
    otevrena && !konverzace.some((k) => k.klientId === otevrena)
      ? klienti.find((k) => k.id === otevrena)
      : undefined
  const seznam: Konverzace[] = nova
    ? [{ klientId: nova.id, jmeno: nova.jmeno, posledni: null, neprectene: 0 }, ...konverzace]
    : konverzace
  const vybrana = seznam.find((k) => k.klientId === otevrena) ?? null

  function otevri(id: string) {
    setOtevrena(id)
    window.history.replaceState(null, '', `/advisor/zpravy?klient=${id}`)
  }

  function zavri() {
    vratFokus.current = otevrena
    setOtevrena(null)
    window.history.replaceState(null, '', '/advisor/zpravy')
  }

  // Na telefonu seznam po otevření zmizí i s prvkem, na který se kliklo.
  // Fokus proto předáme tlačítku Zpět, ať nespadne na začátek stránky,
  // a po návratu zpátky na řádek konverzace.
  useEffect(() => {
    if (otevrena) {
      const aktivni = document.activeElement
      if (aktivni instanceof HTMLElement && aktivni.offsetParent === null) zpetRef.current?.focus()
      return
    }
    const id = vratFokus.current
    if (!id) return
    vratFokus.current = null
    seznamRef.current?.querySelector<HTMLElement>(`[data-klient="${id}"]`)?.focus()
  }, [otevrena])

  return (
    <div
      className={`rounded-card border border-line bg-surface overflow-hidden lg:grid lg:grid-cols-[20rem_minmax(0,1fr)] lg:h-[calc(100dvh-12rem)] lg:min-h-[30rem] ${
        vybrana ? 'flex flex-col h-[calc(100dvh-14rem)] min-h-[24rem]' : ''
      }`}
    >
      {/* Seznam konverzací */}
      <div className={`${vybrana ? 'hidden lg:flex' : 'flex'} flex-col min-h-0 lg:border-r lg:border-line`}>
        <div className="shrink-0 p-3 border-b border-line">
          <label htmlFor={`${uid}-napsat`} className="sr-only">
            Napsat klientovi
          </label>
          <select
            id={`${uid}-napsat`}
            value=""
            onChange={(e) => e.target.value && otevri(e.target.value)}
            className="w-full h-11 rounded-input border border-line bg-surface px-3 text-base text-navy focus:outline-none focus:border-mint focus:ring-4 focus:ring-mint/20"
          >
            <option value="">Napsat klientovi…</option>
            {klienti.map((k) => (
              <option key={k.id} value={k.id}>
                {k.jmeno}
              </option>
            ))}
          </select>
        </div>
        {seznam.length === 0 ? (
          <p className="p-5 text-base text-slate text-pretty">
            Zatím vám nikdo nenapsal. Nová zpráva se tu ukáže sama, stránku není potřeba obnovovat.
          </p>
        ) : (
          <ul ref={seznamRef} className="divide-y divide-line lg:flex-1 lg:min-h-0 lg:overflow-y-auto">
            {seznam.map((k) => {
              const aktivni = k.klientId === vybrana?.klientId
              // Otevřenou konverzaci právě čtu – chat si její zprávy označí sám.
              const neprectene = aktivni ? 0 : k.neprectene
              return (
                <li key={k.klientId}>
                  <button
                    type="button"
                    data-klient={k.klientId}
                    aria-current={aktivni ? 'true' : undefined}
                    onClick={() => otevri(k.klientId)}
                    className={`w-full text-left flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-cream focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-mint/40 ${
                      aktivni ? 'bg-cream' : ''
                    }`}
                  >
                    <RadekKonverzace k={k} neprectene={neprectene} />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Otevřená konverzace */}
      <div className={`${vybrana ? 'flex' : 'hidden lg:flex'} flex-1 flex-col min-h-0 min-w-0`}>
        {vybrana ? (
          <>
            <div className="shrink-0 flex items-center gap-1 px-2 lg:px-4 py-1 border-b border-line">
              <button
                ref={zpetRef}
                type="button"
                onClick={zavri}
                className="lg:hidden inline-flex items-center gap-1.5 h-11 px-3 rounded-pill text-sm font-semibold text-navy hover:bg-cream focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden /> Zpět
              </button>
              <p className="min-w-0 flex-1 truncate px-1 py-3 font-semibold text-navy">{vybrana.jmeno}</p>
              <Link
                href={`/advisor/${vybrana.klientId}`}
                className="shrink-0 inline-flex items-center gap-1 h-11 px-3 rounded-pill text-sm font-semibold text-navy hover:bg-cream focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40"
              >
                <span className="hidden sm:inline">Detail klienta</span>
                <span className="sm:hidden">Detail</span>
                <ArrowUpRight className="w-4 h-4" aria-hidden />
              </Link>
            </div>
            <div className="flex-1 min-h-0 flex flex-col">
              <ChatWindow key={vybrana.klientId} clientId={vybrana.klientId} myRole="advisor" />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center text-slate">
            <MessageCircle className="w-8 h-8" aria-hidden strokeWidth={1.5} />
            <p className="text-base">Vyberte konverzaci vlevo, nebo napište klientovi.</p>
          </div>
        )}
      </div>
    </div>
  )
}
