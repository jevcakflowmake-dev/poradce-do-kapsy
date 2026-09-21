/**
 * Kanonická adresa webu – jedno místo pro metadata, sitemap i robots.
 *
 * Po koupi vlastní domény stačí nastavit `NEXT_PUBLIC_SITE_URL` ve Vercelu
 * (Settings → Environment Variables) a znovu nasadit; nic v kódu se nemění.
 * Bez proměnné se použije současná adresa na vercel.app.
 */
const FALLBACK_URL = 'https://poradce-do-kapsy.vercel.app'

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
