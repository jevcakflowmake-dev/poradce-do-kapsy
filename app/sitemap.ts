import type { MetadataRoute } from 'next'
import { SITE_URL, absoluteUrl } from '@/lib/site'
import { TEMATA } from '@/lib/temata'
import { nactiNovinky } from '@/lib/novinky'

/**
 * Jen veřejné stránky. `lastModified` se vyhodnotí při buildu, takže se
 * datum posune s každým nasazením – pro web této velikosti to stačí.
 * Novinky mají datum zveřejnění. Sitemap se skládá při každém stažení
 * (jeden dotaz do databáze, vyhledávače ji stahují zřídka) – jako cachovanou
 * ji revalidatePath('/sitemap.xml') po novém článku neobnovil.
 */
export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date()
  const novinky = await nactiNovinky(500)

  return [
    {
      // Next normalizuje canonical na kořeni bez koncového lomítka (viz
      // layout.tsx) – SITE_URL místo absoluteUrl('/'), ať sitemap sedí.
      url: SITE_URL,
      lastModified,
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      // Hlavní vstupní bod pro nové klienty – analýzu vyplní bez registrace.
      url: absoluteUrl('/analyza'),
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    // Vstupní stránky oblastí (hypotéka, pojištění, spoření a investice).
    ...TEMATA.map((tema) => ({
      url: absoluteUrl(tema.cesta),
      lastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    // Výpis Novinek až s prvním článkem – prázdnou stránku do vyhledávačů neposílat.
    ...(novinky.length > 0
      ? [
          {
            url: absoluteUrl('/novinky'),
            lastModified: new Date(novinky[0].zverejneno_at),
            changeFrequency: 'weekly' as const,
            priority: 0.6,
          },
          ...novinky.map((n) => ({
            url: absoluteUrl(`/novinky/${n.slug}`),
            lastModified: new Date(n.zverejneno_at),
            changeFrequency: 'yearly' as const,
            priority: 0.5,
          })),
        ]
      : []),
    {
      url: absoluteUrl('/zasady-ochrany-osobnich-udaju'),
      lastModified,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: absoluteUrl('/obchodni-podminky'),
      lastModified,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: absoluteUrl('/zasady-cookies'),
      lastModified,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
  ]
}
