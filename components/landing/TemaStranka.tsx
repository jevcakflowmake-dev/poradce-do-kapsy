import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import SiteHeader from '@/components/landing/SiteHeader'
import SiteFooter from '@/components/landing/SiteFooter'
import CtaSection from '@/components/landing/CtaSection'
import FaqSeznam, { type Dotaz } from '@/components/landing/FaqSeznam'
import { TEMATA, type CestaTematu } from '@/lib/temata'

type Karta = { titul: string; popis: string }

export type ObsahTematu = {
  cesta: CestaTematu
  h1: string
  perex: string
  /** Název kliknutí na hlavní tlačítko v Google Analytics, např. klik_hypoteka_analyza. */
  udalostCta: string
  uvod: {
    nadpis: string
    odstavce: readonly string[]
    /** Drobná poznámka pod textem, např. upozornění na riziko investic. */
    poznamka?: string
  }
  situace: { nadpis: string; karty: readonly Karta[] }
  /** Tři kroky. Lhůty 15 minut a 48 hodin jsou slib celého webu, neměnit. */
  postup: readonly Karta[]
  proc: { nadpis: string; perex: string; karty: readonly Karta[] }
  dotazy: readonly Dotaz[]
}

const OBAL = 'max-w-8xl mx-auto px-6 md:px-10 lg:px-16 xl:px-20'

/**
 * Vstupní stránka jedné oblasti (hypotéka, pojištění, spoření a investice).
 * Sekce kopírují úvodní stránku – tmavý úvod, karty, kroky, pilíře, dotazy –
 * a všechny tři stránky sdílejí tuhle kostru, aby se sazba nerozešla.
 *
 * Cíl je stejný jako na úvodní stránce: dotazník na /analyza.
 */
export default function TemaStranka({ obsah }: { obsah: ObsahTematu }) {
  const dalsi = TEMATA.filter((t) => t.cesta !== obsah.cesta)

  return (
    <div className="min-h-screen bg-cream">
      <SiteHeader naUvod />

      <main>
        <section className="bg-navy text-cream textura-navy">
          <div className={`${OBAL} pt-14 pb-16 md:pt-20 md:pb-24`}>
            <div className="max-w-4xl">
              <h1 className="font-display text-h2 md:text-display text-cream text-balance">{obsah.h1}</h1>
              <p className="mt-6 text-lead text-cream/80 max-w-2xl text-pretty">{obsah.perex}</p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link href="/analyza" data-mereni-klik={obsah.udalostCta} className={buttonVariants({ size: 'lg' })}>
                  Vyplnit analýzu zdarma
                </Link>
                <a href="#jak-to-probiha" className={buttonVariants({ variant: 'onDark', size: 'lg' })}>
                  Jak to probíhá
                </a>
              </div>
              <p className="mt-6 text-base text-cream/60">
                Zdarma a nezávazně · Nic nepodepisujete · Data v EU
              </p>
            </div>
          </div>
        </section>

        <section className="bg-cream py-20 md:py-28">
          <div className={OBAL}>
            <h2 className="font-display text-h2 text-navy">{obsah.uvod.nadpis}</h2>
            <div className="mt-6 space-y-5 text-lead text-navy max-w-3xl text-pretty">
              {obsah.uvod.odstavce.map((odstavec) => (
                <p key={odstavec}>{odstavec}</p>
              ))}
            </div>
            {obsah.uvod.poznamka && (
              <p className="mt-6 text-base text-slate max-w-3xl text-pretty">{obsah.uvod.poznamka}</p>
            )}
          </div>
        </section>

        <section className="bg-cream pb-20 md:pb-28">
          <div className={OBAL}>
            <h2 className="font-display text-h2 text-navy">{obsah.situace.nadpis}</h2>
            <ul className="mt-10 md:mt-14 grid gap-5 md:grid-cols-3">
              {obsah.situace.karty.map((k) => (
                <li key={k.titul} className="rounded-card border border-line bg-surface shadow-card p-7 md:p-8">
                  <h3 className="font-display text-h3 text-navy">{k.titul}</h3>
                  <p className="text-base text-slate mt-2 text-pretty">{k.popis}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="jak-to-probiha" className="bg-cream pb-20 md:pb-28 scroll-mt-28">
          <div className={OBAL}>
            <h2 className="font-display text-h2 text-navy">Jak to probíhá</h2>
            <ol className="mt-10 md:mt-14 grid gap-5 md:grid-cols-3">
              {obsah.postup.map((krok, i) => (
                <li key={krok.titul} className="rounded-card border border-line bg-surface shadow-card p-7 md:p-8">
                  <span
                    aria-hidden
                    className="inline-flex items-center justify-center w-11 h-11 rounded-pill bg-navy text-cream font-display text-lg"
                  >
                    {i + 1}
                  </span>
                  <h3 className="font-display text-h3 text-navy mt-5">{krok.titul}</h3>
                  <p className="text-base text-slate mt-2 text-pretty">{krok.popis}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Bílý podklad a krémové karty s mátovou hranou jako u „Čeho se držím“.
            Máta je tu jen dekorace – na světlém podkladu by jako text neprošla. */}
        <section className="bg-surface py-20 md:py-28">
          <div className={OBAL}>
            <h2 className="font-display text-h2 text-navy">{obsah.proc.nadpis}</h2>
            <p className="text-lead text-slate mt-4 max-w-2xl text-pretty">{obsah.proc.perex}</p>
            <ul className="mt-10 md:mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {obsah.proc.karty.map((k) => (
                <li key={k.titul} className="rounded-card border border-line border-l-4 border-l-mint bg-cream p-7 md:p-8">
                  <h3 className="font-display text-h3 text-navy">{k.titul}</h3>
                  <p className="text-base text-slate mt-3 text-pretty">{k.popis}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="bg-cream py-20 md:py-28">
          <div className={OBAL}>
            <h2 className="font-display text-h2 text-navy">Časté dotazy</h2>
            <FaqSeznam dotazy={obsah.dotazy} />
          </div>
        </section>

        <section className="bg-cream pb-20 md:pb-28">
          <div className={OBAL}>
            <h2 className="font-display text-h2 text-navy">S čím dalším pomůžu</h2>
            <ul className="mt-10 md:mt-14 grid gap-5 md:grid-cols-2">
              {dalsi.map((t) => (
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

        <CtaSection />
      </main>

      <SiteFooter naUvod />
    </div>
  )
}
