import { ocistiProdukt, type ProduktVarianty } from '@/lib/produkt-varianty'

/**
 * Katalog produktů – šablony variant plánu (tabulka katalog_produktu,
 * migrace 020). Šablona drží, co patří produktu: společnost, detail
 * produktu, parametry a u investic výnos. Platba je jen předvyplněná.
 */

export const SEKCE_KATALOGU = ['income', 'housing', 'retirement', 'children', 'investing', 'property'] as const

/** Parametr varianty v šabloně – jako řádek plan_params bez id a pořadí. */
export interface ParametrSablony {
  param_label: string
  value: string
  note: string
}

export interface SablonaProduktu {
  id: string
  sekce: string
  nazev: string
  spolecnost: string
  logo: string
  mesicni_platba: string
  produkt: ProduktVarianty
  parametry: ParametrSablony[]
  vynos: number | null
}

/** Jen parametry s popiskem i hodnotou, rozumně dlouhé – jsonb může obsahovat cokoliv. */
export function ocistiParametry(vstup: unknown): ParametrSablony[] {
  if (!Array.isArray(vstup)) return []
  return vstup
    .flatMap((p) => {
      if (!p || typeof p !== 'object') return []
      const o = p as Record<string, unknown>
      const popisek = typeof o.param_label === 'string' ? o.param_label.trim().slice(0, 120) : ''
      const hodnota = typeof o.value === 'string' ? o.value.trim().slice(0, 200) : ''
      if (!popisek || !hodnota) return []
      return [{ param_label: popisek, value: hodnota, note: typeof o.note === 'string' ? o.note.trim().slice(0, 500) : '' }]
    })
    .slice(0, 40)
}

/** Řádek z databáze → šablona. */
export function ctiSablonu(radek: {
  id: string
  sekce: string
  nazev: string
  spolecnost: string
  logo: string | null
  mesicni_platba: string | null
  produkt: unknown
  parametry: unknown
  vynos: number | string | null
}): SablonaProduktu {
  const vynos = radek.vynos === null ? null : Number(radek.vynos)
  return {
    id: radek.id,
    sekce: radek.sekce,
    nazev: radek.nazev,
    spolecnost: radek.spolecnost,
    logo: radek.logo ?? '',
    mesicni_platba: radek.mesicni_platba ?? '',
    produkt: ocistiProdukt(radek.produkt),
    parametry: ocistiParametry(radek.parametry),
    vynos: vynos !== null && Number.isFinite(vynos) ? vynos : null,
  }
}

/**
 * Výnos ze šablony u varianty (details.vychoziVynos). Graf se z něj sám
 * nevytvoří – chybí doba a vklady klienta –, jen se nabídne ve formuláři.
 */
export function vychoziVynos(details: unknown): number | null {
  if (!details || typeof details !== 'object') return null
  const v = (details as Record<string, unknown>).vychoziVynos
  return typeof v === 'number' && v >= 0 && v <= 30 ? v : null
}
