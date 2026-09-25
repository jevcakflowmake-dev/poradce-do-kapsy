import { RISK_DEFS, ocistiVolbyKryti, type RiskKey, type VolbyKryti } from './income-risks'
import { ctiProdukt } from './produkt-varianty'
import type { ObsahSmlouvy, PlatbaSmlouvy } from './smlouvy'

/**
 * Smlouva z varianty plánu: klient si variantu vybral, poradce ji sjednal
 * a teď ji převádí do sekce Moje smlouvy.
 *
 * Z varianty se bere všechno, co už v plánu je – pojišťovna, produkt,
 * popis, platnost, kontakty a u zajištění příjmu sjednané částky krytí.
 * Poradce doplní jen to, co vznikne až podpisem: číslo smlouvy a platební
 * údaje. Klient tak smlouvu vidí popsanou stejnými slovy, podle kterých se
 * v plánu rozhodoval.
 */

export interface VariantaProSmlouvu {
  id: string
  section: string
  company: string
  monthly_payment: string
  details: unknown
}

/** Částky krytí z varianty zajištění příjmu – stejné klíče, jaké vykresluje KrytiPojistky. */
export function krytiZVarianty(details: unknown): Partial<Record<RiskKey, number>> | undefined {
  if (!details || typeof details !== 'object') return undefined
  const zdroj = details as Record<string, unknown>
  const kryti: Partial<Record<RiskKey, number>> = {}
  for (const { key } of RISK_DEFS) {
    const castka = zdroj[key]
    if (typeof castka === 'number' && Number.isFinite(castka) && castka > 0) kryti[key] = castka
  }
  return Object.keys(kryti).length > 0 ? kryti : undefined
}

/** Volby plnění z varianty (details.volby) – jen u rizik, která varianta opravdu kryje. */
export function volbyZVarianty(details: unknown): VolbyKryti | undefined {
  if (!details || typeof details !== 'object') return undefined
  const volby = ocistiVolbyKryti((details as Record<string, unknown>).volby)
  const kryti = krytiZVarianty(details) ?? {}
  const vysledek: VolbyKryti = {}
  for (const r of RISK_DEFS) {
    if (volby[r.key] && kryti[r.key]) vysledek[r.key] = volby[r.key]
  }
  return Object.keys(vysledek).length > 0 ? vysledek : undefined
}

export function obsahZVarianty(
  varianta: VariantaProSmlouvu,
  udaje: { cisloSmlouvy?: string; frekvence: string; platba: PlatbaSmlouvy },
): ObsahSmlouvy {
  const produkt = ctiProdukt(varianta.details)
  return {
    spolecnost: varianta.company,
    produkt: produkt?.nazev,
    popis: produkt?.popis,
    cisloSmlouvy: udaje.cisloSmlouvy || undefined,
    doVeku: produkt?.doVeku,
    frekvence: udaje.frekvence,
    hlaseni: produkt?.hlaseni,
    kontakt: produkt?.kontakt,
    kryti: varianta.section === 'income' ? krytiZVarianty(varianta.details) : undefined,
    volbyKryti: varianta.section === 'income' ? volbyZVarianty(varianta.details) : undefined,
    platba: udaje.platba,
    zVarianty: varianta.id,
  }
}
