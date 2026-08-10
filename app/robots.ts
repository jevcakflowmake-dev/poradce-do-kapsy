import type { MetadataRoute } from 'next'
import { absoluteUrl } from '@/lib/site'

/**
 * Veřejná je jen marketingová část a přihlášení/registrace.
 * Aplikace za loginem, API a jednorázové auth odkazy do indexu nepatří –
 * roboti se tam sice nedostanou (chrání je RLS a middleware), ale ať se
 * o to ani nepokoušejí a ať se URL neobjevují ve výsledcích vyhledávání.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/auth/',
        '/dashboard',
        '/advisor',
        '/klient',
        '/forgot-password',
        '/reset-password',
        '/update-password',
      ],
    },
    sitemap: absoluteUrl('/sitemap.xml'),
  }
}
