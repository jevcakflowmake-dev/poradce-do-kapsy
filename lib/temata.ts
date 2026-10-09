import type { Metadata } from 'next'
import { SITE_NAME, SITE_TAGLINE } from '@/lib/site'

/**
 * Oblasti, které mají vlastní vstupní stránku pro vyhledávače. Jedno místo
 * pro adresy a krátké popisky: čte je sekce na úvodní stránce, prolinkování
 * mezi stránkami i sitemap. Obsah stránek je v `app/<adresa>/page.tsx`.
 *
 * Investice samostatnou stránku nemají schválně: jsou součástí
 * /sporeni-a-investice a druhá stránka by s ní soutěžila o stejné dotazy.
 *
 * `udalost` je název kliknutí na kartu oblasti v Google Analytics.
 */
export const TEMATA = [
  {
    cesta: '/hypoteka',
    nazev: 'Hypotéka a refinancování',
    popis: 'Nové bydlení i končící fixace. Porovnám nabídky bank, se kterými spolupracuji.',
    udalost: 'klik_oblast_hypoteka',
  },
  {
    cesta: '/pojisteni',
    nazev: 'Životní pojištění',
    popis: 'Krytí příjmu pro případ dlouhé nemoci, úrazu nebo invalidity.',
    udalost: 'klik_oblast_pojisteni',
  },
  {
    cesta: '/sporeni-a-investice',
    nazev: 'Spoření a investice',
    popis: 'Penzijní spoření a pravidelné investování podle vašich cílů.',
    udalost: 'klik_oblast_sporeni',
  },
  {
    cesta: '/zajisteni-deti',
    nazev: 'Zajištění dětí',
    popis: 'Spoření do začátku a pojištění podle věku dítěte.',
    udalost: 'klik_oblast_deti',
  },
  {
    cesta: '/pojisteni-majetku',
    nazev: 'Pojištění majetku',
    popis: 'Nemovitost, domácnost, odpovědnost a auto. I kontrola starších smluv.',
    udalost: 'klik_oblast_majetek',
  },
] as const

export type CestaTematu = (typeof TEMATA)[number]['cesta']

/**
 * Metadata stránky oblasti. Titulek dostane od layoutu příponu „· Poradce do
 * kapsy“ (19 znaků), takže sám má mít 31–41 znaků.
 *
 * Open Graph a Twitter se tu nastavují znovu celé: stránka je po layoutu
 * nedědí po položkách, ale jako celek, a bez toho by sdílený odkaz na
 * oblast nesl titulek i adresu úvodní stránky. Ze stejného důvodu se musí
 * znovu uvést i náhledový obrázek – jinak ze sdíleného odkazu zmizí.
 */
export function metadataTematu({
  titulek,
  popis,
  cesta,
}: {
  titulek: string
  popis: string
  cesta: CestaTematu
}): Metadata {
  const celyTitulek = `${titulek} · ${SITE_NAME}`
  // Společný náhled webu z app/opengraph-image.tsx (a jeho dvojče pro X).
  const nahled = {
    width: 1200,
    height: 630,
    type: 'image/png',
    alt: `${SITE_NAME} – ${SITE_TAGLINE}`,
  }
  return {
    title: titulek,
    description: popis,
    alternates: { canonical: cesta },
    openGraph: {
      type: 'website',
      locale: 'cs_CZ',
      siteName: SITE_NAME,
      url: cesta,
      title: celyTitulek,
      description: popis,
      images: [{ url: '/opengraph-image', ...nahled }],
    },
    twitter: {
      card: 'summary_large_image',
      title: celyTitulek,
      description: popis,
      images: [{ url: '/twitter-image', ...nahled }],
    },
  }
}
