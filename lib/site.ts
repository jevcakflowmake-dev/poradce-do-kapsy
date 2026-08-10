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
  'Vyplňte analýzu bez registrace a do 48 hodin dostanete finanční plán na míru: kde máte díru v zajištění a kolik ji stojí zalepit u tří konkrétních společností. Zdarma a nezávazně.'

/** Absolutní URL k dané cestě, např. absoluteUrl('/login'). */
export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}
