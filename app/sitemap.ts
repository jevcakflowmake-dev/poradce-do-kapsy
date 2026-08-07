import type { MetadataRoute } from 'next'
import { absoluteUrl } from '@/lib/site'

/**
 * Jen veřejné stránky. `lastModified` se vyhodnotí při buildu, takže se
 * datum posune s každým nasazením — pro web této velikosti to stačí.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  return [
    {
      url: absoluteUrl('/'),
      lastModified,
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      // Hlavní vstupní bod pro nové klienty — analýzu vyplní bez registrace.
      url: absoluteUrl('/analyza'),
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: absoluteUrl('/signup'),
      lastModified,
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    {
      url: absoluteUrl('/login'),
      lastModified,
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: absoluteUrl('/zasady-ochrany-osobnich-udaju'),
      lastModified,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]
}
