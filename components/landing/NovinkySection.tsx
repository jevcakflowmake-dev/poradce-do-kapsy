import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { nactiNovinky } from '@/lib/novinky'
import KartaNovinky from '@/components/landing/KartaNovinky'

/**
 * Poslední tři články z Novinek na úvodní stránce. Dokud není zveřejněný
 * žádný, sekce se nevykreslí – prázdná sekce by působila jako opuštěný web.
 */
export default async function NovinkySection() {
  const novinky = await nactiNovinky(3)
  if (novinky.length === 0) return null

  return (
    // Hned pod tmavým ceníkem: odsazení nahoře, spodní dodá sekce Časté dotazy.
    <section data-mereni-videno="sekce_novinky" className="bg-cream pt-20 md:pt-28">
      <div className="max-w-8xl mx-auto px-6 md:px-10 lg:px-16 xl:px-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-h2 text-navy">Novinky z finančního světa</h2>
            <p className="text-lead text-slate mt-4 max-w-2xl text-pretty">
              Co se změnilo u bank, pojišťoven a na trhu a co to znamená pro vaše peníze.
            </p>
          </div>
          <Link
            href="/novinky"
            data-mereni-klik="klik_novinky_vse"
            className="inline-flex items-center gap-1.5 text-base font-semibold text-navy rounded-pill hover:underline underline-offset-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40"
          >
            Všechny novinky <ArrowRight className="w-4 h-4" aria-hidden />
          </Link>
        </div>
        <ul className="mt-10 md:mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {novinky.map((n) => (
            <li key={n.slug}>
              <KartaNovinky novinka={n} nadpis="h3" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
