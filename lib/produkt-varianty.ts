/**
 * Produktová část varianty plánu.
 *
 * Nápad ze staršího papírového plánu klienta (ProfiFP/OVB): u každého
 * produktu byla vedle ceny i stránka s tím, co to je, do kdy to běží
 * a kam volat, když nastane pojistná událost. To poslední je v papírovém
 * plánu možná nejužitečnější věc vůbec — klient, který si za tři roky
 * zlomí nohu, má kontakt po ruce právě v dokumentu, který si uložil.
 *
 * Bydlí to v `plan_variants.details` (jsonb) pod klíčem `produkt`, takže
 * to nepotřebuje migraci. Vnořený klíč schválně: `details` u zajištění
 * příjmu drží čísla rizik (`payout_60`, `disability_3`…) a míchat je
 * s textovými poli by dřív nebo později skončilo kolizí.
 */

export interface ProduktVarianty {
  /** Obchodní název produktu, např. „BelMondo 20". Firma je ve sloupci `company`. */
  nazev?: string
  /** Dvě věty o tom, co produkt dělá. */
  popis?: string
  /** Do jakého věku smlouva běží. */
  doVeku?: string
  /** Jak často se platí. */
  frekvence?: string
  /** Kam hlásit pojistnou událost – odkaz nebo telefon. */
  hlaseni?: string
  /** Kam psát kvůli platbám a změnám – odkaz nebo telefon. */
  kontakt?: string
}

const KLICE = ['nazev', 'popis', 'doVeku', 'frekvence', 'hlaseni', 'kontakt'] as const

/** Bezpečné čtení z jsonb, který může obsahovat cokoliv. Prázdné → null. */
export function ctiProdukt(details: unknown): ProduktVarianty | null {
  if (!details || typeof details !== 'object') return null
  const syrovy = (details as Record<string, unknown>).produkt
  if (!syrovy || typeof syrovy !== 'object') return null

  const produkt: ProduktVarianty = {}
  for (const klic of KLICE) {
    const hodnota = (syrovy as Record<string, unknown>)[klic]
    if (typeof hodnota === 'string' && hodnota.trim().length > 0) produkt[klic] = hodnota.trim()
  }
  return Object.keys(produkt).length > 0 ? produkt : null
}

/** Ponechá jen známé klíče s neprázdnou hodnotou – co přijde z formuláře, se nedá věřit. */
export function ocistiProdukt(vstup: unknown): ProduktVarianty {
  if (!vstup || typeof vstup !== 'object') return {}
  const zdroj = vstup as Record<string, unknown>
  const produkt: ProduktVarianty = {}
  for (const klic of KLICE) {
    const hodnota = zdroj[klic]
    if (typeof hodnota === 'string' && hodnota.trim().length > 0) produkt[klic] = hodnota.trim().slice(0, 500)
  }
  return produkt
}

/**
 * Odkaz, telefon, nebo prostý text. Poradce zadává jedno pole a nemá řešit,
 * jestli je to URL — rozhodne se tady.
 */
export function odkazNaKontakt(hodnota: string): { href: string; popisek: string } | null {
  const ocistene = hodnota.trim()
  if (!ocistene) return null
  if (/^https?:\/\//i.test(ocistene)) return { href: ocistene, popisek: ocistene.replace(/^https?:\/\//i, '') }
  if (/^[+\d][\d\s()-]{7,}$/.test(ocistene)) return { href: `tel:${ocistene.replace(/[\s()-]/g, '')}`, popisek: ocistene }
  if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(ocistene)) return { href: `mailto:${ocistene}`, popisek: ocistene }
  return null
}
