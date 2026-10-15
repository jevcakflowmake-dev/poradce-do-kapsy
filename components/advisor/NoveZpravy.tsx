import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { Konverzace } from '@/lib/konverzace'
import RadekKonverzace, { Odznak, pocetNeprectenych } from '@/components/advisor/RadekKonverzace'

/**
 * Posledních pár konverzací v Přehledu. Celý chat je ve Zprávách – řádek
 * tam rovnou otevře danou konverzaci. Živě se obnovuje přes ZiveZpravy
 * v rozložení panelu.
 */
export default function NoveZpravy({ konverzace, neprecteneCelkem }: { konverzace: Konverzace[]; neprecteneCelkem: number }) {
  return (
    <section aria-labelledby="nove-zpravy" className="rounded-card border border-line bg-surface overflow-hidden">
      <h2 id="nove-zpravy" className="font-display text-navy text-h3 flex items-center gap-2 px-5 md:px-6 pt-5 md:pt-6 pb-4">
        Zprávy
        {neprecteneCelkem > 0 && (
          <>
            <Odznak pocet={neprecteneCelkem} />
            <span className="sr-only">{pocetNeprectenych(neprecteneCelkem)}</span>
          </>
        )}
      </h2>
      {konverzace.length === 0 ? (
        <p className="px-5 md:px-6 pb-5 md:pb-6 text-base text-slate text-pretty">
          Zatím vám nikdo nenapsal. Nová zpráva se tu ukáže sama, stránku není potřeba obnovovat.
        </p>
      ) : (
        <ul className="border-t border-line divide-y divide-line">
          {konverzace.map((k) => (
            <li key={k.klientId}>
              <Link
                href={`/advisor/zpravy?klient=${k.klientId}`}
                className="flex items-center gap-3 px-5 md:px-6 py-3.5 transition-colors hover:bg-cream focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-mint/40"
              >
                <RadekKonverzace k={k} neprectene={k.neprectene} />
              </Link>
            </li>
          ))}
        </ul>
      )}
      <div className="border-t border-line px-5 md:px-6 py-3">
        <Link
          href="/advisor/zpravy"
          className="inline-flex items-center gap-1.5 py-1 text-base font-semibold text-navy rounded-pill hover:underline underline-offset-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40"
        >
          Všechny zprávy <ArrowRight className="w-4 h-4" aria-hidden />
        </Link>
      </div>
    </section>
  )
}
