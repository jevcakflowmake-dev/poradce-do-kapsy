import type { Metadata } from 'next'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import SiteFooter from '@/components/landing/SiteFooter'

export const metadata: Metadata = {
  title: 'Analýza odeslána',
  // Konverzní stránka nepatří do vyhledávání, měření reklamy tím neutrpí.
  robots: { index: false, follow: false },
}

/**
 * Cíl konverze pro Meta i Google Ads. Vlastní URL má smysl právě proto,
 * že jde změřit dokončení a odlišit ho od zobrazení analýzy.
 *
 * Google Analytics dostává událost `analyza_odeslana` už z analýzy ve
 * chvíli úspěšného odeslání (app/analyza/AnalysisWizard.tsx), takže tady nic
 * dalšího není. TODO (až řekne Jakub): událost pro Meta Pixel.
 */
export default function DekujemePage() {
  // Stejný text pro všechny: kdyby stránka říkala „účet už existuje“, šlo by
  // zadáním cizího e-mailu zjistit, kdo je klientem. Podrobnosti (heslo,
  // přihlášení, odmítnuté heslo) dostane jen majitel adresy e-mailem.
  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <main className="flex-1 mx-auto w-full max-w-4xl px-6 py-16 md:py-24">
        <p className="text-base text-slate">Hotovo · analýzu mám</p>
        <h1 className="font-display text-h2 text-navy mt-3">Analýza odeslána.</h1>

        <p className="mt-6 text-lead text-navy max-w-2xl text-pretty">
          Na zadaný e-mail jsem vám poslal potvrzení a co bude dál. Když jste si zvolili heslo,
          najdete v e-mailu odkaz, kterým účet aktivujete. Kdyby e-mail do pár minut nedorazil,
          podívejte se do složky hromadné pošty nebo spamu.
        </p>

        <section className="mt-12">
          <h2 className="font-display text-h3 text-navy">Co bude dál</h2>
          <ol className="mt-6 space-y-4 max-w-2xl">
            {[
              { titul: 'Projdu vaše odpovědi i přílohy.', popis: 'Když mi něco nebude jasné, napíšu vám na e-mail.' },
              { titul: 'Do 48 hodin vám pošlu návrh.', popis: 'Včetně vysvětlení, proč zrovna takhle.' },
              { titul: 'Nikdo vám nezavolá.', popis: 'Dokud si to sami nevyžádáte. Telefon je nepovinný.' },
            ].map((k, i) => (
              <li key={k.titul} className="rounded-card border border-line bg-surface p-5 flex gap-4">
                <span
                  aria-hidden
                  className="shrink-0 w-9 h-9 rounded-pill bg-navy text-cream font-display flex items-center justify-center"
                >
                  {i + 1}
                </span>
                <div>
                  <p className="text-base font-medium text-navy">{k.titul}</p>
                  <p className="text-base text-slate mt-1">{k.popis}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <div className="mt-10 flex flex-col sm:flex-row gap-3">
          <Link href="/" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
            Zpět na úvod
          </Link>
        </div>
      </main>

      <SiteFooter naUvod />
    </div>
  )
}
