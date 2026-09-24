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
 * že jde změřit dokončení a odlišit ho od zobrazení dotazníku.
 *
 * TODO (až řekne Jakub): sem přijde událost pro Meta Pixel a GA4.
 * Skripty samotné patří do app/layout.tsx, ne sem.
 */
export default async function DekujemePage({
  searchParams,
}: {
  searchParams: Promise<{ stav?: string; heslo?: string }>
}) {
  const { stav, heslo } = await searchParams
  const existujici = stav === 'existujici'
  const maHeslo = heslo === '1'
  // Heslo, které Supabase odmítl jako uniklé nebo slabé – účet vznikl bez něj.
  const slabeHeslo = heslo === 'slabe'

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <main className="flex-1 mx-auto w-full max-w-4xl px-6 py-16 md:py-24">
        <p className="text-base text-slate">
          {existujici ? 'Přijato · ozvu se vám' : 'Hotovo · analýzu mám'}
        </p>
        <h1 className="font-display text-h2 text-navy mt-3">Analýza odeslána.</h1>

        <p className="mt-6 text-lead text-navy max-w-2xl text-pretty">
          {existujici
            ? 'S tímhle e-mailem už účet existuje, takže odpovědi zatím nikam nepřepisuju. Projdu je a ozvu se vám. Pokud jste to vy a heslo si pamatujete, můžete se rovnou přihlásit.'
            : maHeslo
              ? 'Účet máte založený. Poslal jsem vám e-mail s potvrzovacím odkazem – po kliknutí na něj se přihlásíte a plán uvidíte hned, jak bude hotový.'
              : slabeHeslo
                ? 'Zvolené heslo jsem nepoužil – objevilo se v únicích dat z jiných webů, takže by nebylo bezpečné. Jakmile bude plán hotový, pošlu vám odkaz, kterým si nastavíte jiné.'
                : 'Jakmile bude plán hotový, pošlu vám na e-mail odkaz, kterým si nastavíte heslo a plán si prohlédnete online.'}
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
          {(existujici || maHeslo) && (
            <Link href="/login" className={buttonVariants({ size: 'lg' })}>
              Přihlásit se
            </Link>
          )}
          <Link href="/" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
            Zpět na úvod
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
