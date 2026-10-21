import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { datumNovinky, minutCteni, type Novinka } from '@/lib/novinky'

/** Karta článku ve výpisu Novinek a v sekci na úvodní stránce. Celá karta je odkaz. */
export default function KartaNovinky({ novinka, nadpis: Nadpis = 'h2' }: { novinka: Novinka; nadpis?: 'h2' | 'h3' }) {
  return (
    <Link
      href={`/novinky/${novinka.slug}`}
      data-mereni-klik="klik_novinka"
      className="group flex h-full flex-col rounded-card border border-line bg-surface shadow-card p-7 md:p-8 transition-colors hover:border-navy/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40"
    >
      <p className="text-base text-slate">
        <time dateTime={novinka.zverejneno_at}>{datumNovinky(novinka.zverejneno_at)}</time> · {minutCteni(novinka)} min čtení
      </p>
      <Nadpis className="mt-3 font-display text-h3 text-navy text-pretty">{novinka.titulek}</Nadpis>
      <p className="mt-3 text-base text-slate text-pretty line-clamp-4">{novinka.perex}</p>
      <span className="mt-auto pt-5 inline-flex items-center gap-1.5 text-base font-semibold text-navy">
        Číst článek
        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
      </span>
    </Link>
  )
}
