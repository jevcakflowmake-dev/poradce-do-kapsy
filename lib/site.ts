/**
 * Kanonická adresa webu – jedno místo pro metadata, sitemap, robots
 * i odkazy v e-mailech.
 *
 * Výchozí je vlastní doména (od září 2026, vercel.app na ni přesměrovává).
 * `NEXT_PUBLIC_SITE_URL` ve Vercelu ji umí přebít, třeba pro testovací
 * nasazení. Dřív tu byla adresa na vercel.app a proměnná nastavená nebyla,
 * takže sitemap i odkazy pro klienty ukazovaly na vercel.app.
 */
const FALLBACK_URL = 'https://poradcedokapsy.cz'

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || FALLBACK_URL).replace(/\/+$/, '')

export const SITE_NAME = 'Poradce do kapsy'

export const SITE_DESCRIPTION =
  'Vyplníte analýzu za 15 minut, do 48 hodin dostanete návrh na míru. Bez schůzek, bez tlaku.'

/** Podtitul za názvem webu v <title>. Drží se H1 na úvodní stránce. */
export const SITE_TAGLINE = 'finanční poradce, kterého máte v mobilu'

/** Absolutní URL k dané cestě, např. absoluteUrl('/login'). */
export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

/**
 * Společný základ Open Graph. Stránka, která metadata `openGraph` nastaví
 * sama, ten z layoutu celý přepíše (Next objekty neslučuje), proto ho úvod
 * skládá z této konstanty a přidává jen svou adresu.
 */
export const ZAKLADNI_OG = {
  type: 'website',
  locale: 'cs_CZ',
  siteName: SITE_NAME,
  title: `${SITE_NAME} – ${SITE_TAGLINE}`,
  description: SITE_DESCRIPTION,
} as const
