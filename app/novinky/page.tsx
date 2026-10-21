import SiteHeader from '@/components/landing/SiteHeader'
import SiteFooter from '@/components/landing/SiteFooter'
import CtaSection from '@/components/landing/CtaSection'
import KartaNovinky from '@/components/landing/KartaNovinky'
import { nactiNovinky } from '@/lib/novinky'
import { metadataStranky } from '@/lib/temata'

/**
 * Výpis Novinek. Statická stránka – po zveřejnění článku ji obnoví
 * /api/novinky (revalidatePath), hodina je jen pojistka.
 */
export const revalidate = 3600

export const metadata = metadataStranky({
  titulek: 'Novinky z finančního světa',
  popis: 'Krátké články o tom, co se změnilo u bank, pojišťoven a na finančním trhu a co to znamená pro vaše peníze.',
  cesta: '/novinky',
})

const OBAL = 'max-w-8xl mx-auto px-6 md:px-10 lg:px-16 xl:px-20'

export default async function NovinkyPage() {
  const novinky = await nactiNovinky()

  return (
    <div className="min-h-screen bg-cream">
      <SiteHeader naUvod />
      <main>
        <section className="relative overflow-hidden bg-navy text-cream textura-navy">
          <div className={`relative ${OBAL} pt-14 pb-16 md:pt-20 md:pb-24`}>
            <h1 className="font-display text-h2 md:text-display text-cream text-balance max-w-4xl">Novinky z finančního světa</h1>
            <p className="mt-6 text-lead text-cream/80 max-w-2xl text-pretty">
              Co se změnilo u bank, pojišťoven a na trhu a co to znamená pro vaše peníze. Krátce a bez odborných slov.
            </p>
          </div>
        </section>

        <section className="bg-cream py-16 md:py-24">
          <div className={OBAL}>
            {novinky.length === 0 ? (
              <p className="text-lead text-slate">Zatím tu nic není. První článek přibude brzy.</p>
            ) : (
              <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {novinky.map((n) => (
                  <li key={n.slug}>
                    <KartaNovinky novinka={n} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <CtaSection />
      </main>
      <SiteFooter naUvod />
    </div>
  )
}
