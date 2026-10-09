import type { MetadataRoute } from 'next'
import { SITE_URL, absoluteUrl } from '@/lib/site'

/**
 * Jen veřejné stránky. `lastModified` se vyhodnotí při buildu, takže se
 * datum posune s každým nasazením – pro web této velikosti to stačí.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

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
