import Link from 'next/link'
import { AlertTriangle, ChevronRight, MessageCircle, Sparkles } from 'lucide-react'
import { plural } from '@/lib/utils'
import StatusBadge from '@/components/advisor/StatusBadge'

export interface RadekKlienta {
  id: string
  jmeno: string
  status: string
  /** Rodinná situace jako text. */
  situace: string
  /** Poslední aktivita jako text („dnes“, „před 3 dny“…). */
  aktivita: string
  neprectene: number
  /** Upozornění z vyhodnocení analýzy. */
  flagy: string[]
  /** Reakce na plán: zájem, dotazy, vybrané varianty. */
  reakce: number
}

/** Sloupce řádku od md výš – hlavička a řádky je musí mít stejné. */
const SLOUPCE = 'md:grid-cols-[minmax(0,2fr)_9rem_minmax(0,1.2fr)_7rem_1rem]'

/**
 * Seznam klientů v sekci Klienti. Celý řádek vede na detail. Na telefonu
 * jméno se stavem nahoře a situace s aktivitou pod nimi, od md tabulka.
 */
export default function SeznamKlientu({ klienti }: { klienti: RadekKlienta[] }) {
  return (
    <div className="mt-6 rounded-card border border-line bg-surface overflow-hidden">
      <div
        aria-hidden
        className={`hidden md:grid ${SLOUPCE} gap-4 px-6 py-3 bg-cream border-b border-line text-[11px] font-semibold text-slate tracking-[0.15em] uppercase`}
      >
        <span>Klient</span>
        <span>Stav</span>
        <span>Situace</span>
        <span>Aktivita</span>
        <span />
      </div>
      <ul className="divide-y divide-line">
        {klienti.map((c) => {
          const pocetNeprectenych = c.neprectene
          const pocetFlagu = c.flagy.length
          const pocetReakci = c.reakce
          return (
            <li key={c.id}>
              <Link
                href={`/advisor/${c.id}`}
                className={`group grid grid-cols-[minmax(0,1fr)_auto] ${SLOUPCE} items-center gap-x-4 gap-y-1 px-5 md:px-6 py-4 transition-colors hover:bg-cream focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-mint/40`}
              >
                <span className="min-w-0 flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-navy text-base break-words md:truncate">{c.jmeno}</span>
                  {pocetNeprectenych > 0 && (
                    <span className="inline-flex items-center gap-1 bg-danger text-white text-xs font-bold rounded-pill h-5 px-1.5">
                      <MessageCircle className="w-3 h-3" aria-hidden />
                      {pocetNeprectenych}
                      <span className="sr-only">
                        {plural(pocetNeprectenych, 'nepřečtená zpráva', 'nepřečtené zprávy', 'nepřečtených zpráv')}
                      </span>
                    </span>
                  )}
                  {pocetFlagu > 0 && (
                    <span
                      title={c.flagy.join('\n')}
                      className="inline-flex items-center gap-1 bg-amber/25 text-navy text-xs font-bold rounded-pill border border-amber/50 h-5 px-1.5"
                    >
                      <AlertTriangle className="w-3 h-3" aria-hidden />
                      {pocetFlagu}
                      <span className="sr-only">{plural(pocetFlagu, 'upozornění', 'upozornění', 'upozornění')} z analýzy</span>
                    </span>
                  )}
                  {pocetReakci > 0 && (
                    <span className="inline-flex items-center gap-1 bg-mint/12 text-navy text-xs font-bold rounded-pill border border-mint/30 h-5 px-1.5">
                      <Sparkles className="w-3 h-3" aria-hidden />
                      {pocetReakci}
                      <span className="sr-only">{plural(pocetReakci, 'reakce', 'reakce', 'reakcí')} na plán</span>
                    </span>
                  )}
                </span>
                <span className="justify-self-end md:justify-self-start">
                  <StatusBadge value={c.status} />
                </span>
                {/* Telefon: situace a aktivita na druhém řádku pod jménem */}
                <span className="col-span-2 md:hidden text-sm text-slate">
                  {c.situace}
                      {c.aktivita !== '–' && ` · aktivita ${c.aktivita}`}
                </span>
                <span className="hidden md:block text-base text-navy/80 truncate">{c.situace}</span>
                <span className="hidden md:block text-base text-slate whitespace-nowrap">{c.aktivita}</span>
                <ChevronRight
                  aria-hidden
                  className="hidden md:block w-4 h-4 text-slate transition-transform group-hover:translate-x-0.5 group-hover:text-navy"
                />
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
