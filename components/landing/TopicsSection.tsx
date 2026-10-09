import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { TEMATA } from '@/lib/temata'

/**
 * Rozcestník na stránky oblastí. Úvodní stránka má jediný cíl – dotazník –
 * a tahle sekce od něj nemá odvádět: je až pod partnery a karty vedou na
 * stránky, které končí stejným tlačítkem. Slouží hlavně tomu, kdo chce
 * o jedné oblasti vědět víc, a vyhledávačům jako vnitřní odkaz.
 */
export default function TopicsSection() {
  return (
    <section id="oblasti" data-mereni-videno="sekce_oblasti" className="bg-cream pb-20 md:pb-28 scroll-mt-28">
      <div className="max-w-8xl mx-auto px-6 md:px-10 lg:px-16 xl:px-20">
        <h2 className="font-display text-h2 text-navy">S čím vám pomůžu</h2>
        <p className="text-lead text-slate mt-4 max-w-2xl text-pretty">
          Analýza je jedna pro všechno. Tady je podrobněji, co v ní spolu vyřešíme.
        </p>

        <ul className="mt-10 md:mt-14 grid gap-5 md:grid-cols-3">
          {TEMATA.map((t) => (
            <li key={t.cesta}>
              <Link
                href={t.cesta}
                data-mereni-klik={t.udalost}
                className="group block h-full rounded-card border border-line bg-surface shadow-card p-7 md:p-8 transition-colors hover:border-navy/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40"
              >
                <h3 className="font-display text-h3 text-navy">{t.nazev}</h3>
                <p className="text-base text-slate mt-2 text-pretty">{t.popis}</p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-base font-semibold text-navy">
                  Zjistit víc
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
