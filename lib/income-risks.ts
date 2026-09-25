/**
 * Jediný číselník pojistného krytí: editor zajištění příjmu v plánu,
 * formulář ruční smlouvy, srovnání variant i karty „Co máte sjednané“
 * čtou položky, popisky, jednotky a volby odsud. Díky tomu smlouva zadaná
 * ručně vypadá stejně jako smlouva převedená z plánu.
 *
 * Jednotky: `daily` Kč/den, `monthly` Kč/měsíc, `lump` jednorázově Kč.
 * `moznosti` jsou volby, které u položky rozhodují o plnění – od
 * kolikátého dne se platí, jestli pojistná částka klesá, od kolika procent
 * se plní trvalé následky.
 */

import { BARVY } from '@/lib/barvy'
import {
  Activity, BedDouble, Bandage, Stethoscope,
  ShieldAlert, ShieldX, AlertOctagon, Accessibility, Skull, HeartHandshake,
  type LucideIcon,
} from 'lucide-react'

export type RiskKey =
  | 'daily_accident'
  | 'daily_sick_leave'
  | 'daily_hospitalization'
  | 'permanent_consequences'
  | 'serious_illness'
  | 'disability_1'
  | 'disability_2'
  | 'disability_3'
  | 'self_sufficiency'
  | 'long_term_care'
  | 'death'
  | 'death_accident'

export type RiskUnit = 'daily' | 'monthly' | 'lump'
export type RiskGroup = 'daily' | 'health-events' | 'disability' | 'death'

export interface RiskDef {
  key: RiskKey
  label: string
  short: string
  description: string
  group: RiskGroup
  unit: RiskUnit
  icon: LucideIcon
  /** Brand barva podle skupiny */
  color: string
  /** Volby plnění, jak je poradce zná z pojistné smlouvy. */
  moznosti?: readonly string[]
}

const KLESAJICI_PEVNA = ['klesající pojistná částka', 'pevná pojistná částka'] as const

export const RISK_DEFS: RiskDef[] = [
  // ── Denní dávky ──────────────────────────────────────────
  {
    key: 'daily_accident',
    label: 'Denní odškodné – úraz',
    short: 'Úraz',
    description: 'Vyplácí se za každý den léčení úrazu (zlomenina, popálenina, distorze…).',
    group: 'daily',
    unit: 'daily',
    icon: Bandage,
    color: BARVY.mint,
    moznosti: ['od 1. dne', 'od 8. dne', 'od 29. dne'],
  },
  {
    key: 'daily_sick_leave',
    label: 'Pracovní neschopnost',
    short: 'PN',
    description: 'Doplňuje příjem při nemoci nebo úrazu, když vám klesne na ~60 %.',
    group: 'daily',
    unit: 'daily',
    icon: Activity,
    color: BARVY.mint,
    moznosti: ['od 14. dne', 'od 29. dne'],
  },
  {
    key: 'daily_hospitalization',
    label: 'Hospitalizace',
    short: 'Nemocnice',
    description: 'Denní dávka za pobyt v nemocnici – kryje další náklady navíc k PN.',
    group: 'daily',
    unit: 'daily',
    icon: BedDouble,
    color: BARVY.mint,
    moznosti: ['od 1. dne', 'od 5. dne'],
  },

  // ── Jednorázové zdravotní události ───────────────────────
  {
    key: 'permanent_consequences',
    label: 'Trvalé následky úrazu',
    short: 'Trv. následky',
    description: 'Jednorázová částka při trvalém poškození zdraví následkem úrazu (např. ztráta funkce končetiny).',
    group: 'health-events',
    unit: 'lump',
    icon: Bandage,
    color: BARVY.navySoft,
    moznosti: ['od 0,001 %', 'od 10 %'],
  },
  {
    key: 'serious_illness',
    label: 'Závažné onemocnění',
    short: 'Závažné onem.',
    description: 'Jednorázová částka při diagnóze (rakovina, infarkt, mrtvice, transplantace…).',
    group: 'health-events',
    unit: 'lump',
    icon: Stethoscope,
    color: BARVY.navySoft,
    moznosti: KLESAJICI_PEVNA,
  },
  {
    key: 'self_sufficiency',
    label: 'Ztráta soběstačnosti',
    short: 'Soběstačnost',
    description: 'Jednorázová částka při neschopnosti se sám o sebe postarat (denní úkony).',
    group: 'health-events',
    unit: 'lump',
    icon: Accessibility,
    color: BARVY.navySoft,
  },
  {
    key: 'long_term_care',
    label: 'Dlouhodobá péče',
    short: 'Dlouhodobá péče',
    description: 'Pravidelná měsíční dávka, když potřebujete dlouhodobou péči druhého člověka.',
    group: 'health-events',
    unit: 'monthly',
    icon: HeartHandshake,
    color: BARVY.navySoft,
  },

  // ── Invalidita ───────────────────────────────────────────
  {
    key: 'disability_1',
    label: 'Invalidita I. stupně',
    short: 'Invalidita I.',
    description: 'Pokles pracovní schopnosti o 35–49 % – částečná invalidita.',
    group: 'disability',
    unit: 'lump',
    icon: ShieldAlert,
    color: BARVY.amber,
    moznosti: KLESAJICI_PEVNA,
  },
  {
    key: 'disability_2',
    label: 'Invalidita II. stupně',
    short: 'Invalidita II.',
    description: 'Pokles pracovní schopnosti o 50–69 % – středně těžká invalidita.',
    group: 'disability',
    unit: 'lump',
    icon: AlertOctagon,
    color: BARVY.amber,
    moznosti: KLESAJICI_PEVNA,
  },
  {
    key: 'disability_3',
    label: 'Invalidita III. stupně',
    short: 'Invalidita III.',
    description: 'Pokles pracovní schopnosti o 70 % a víc – plná invalidita.',
    group: 'disability',
    unit: 'lump',
    icon: ShieldX,
    color: BARVY.amber,
    moznosti: KLESAJICI_PEVNA,
  },

  // ── Smrt ─────────────────────────────────────────────────
  {
    key: 'death',
    label: 'Smrt',
    short: 'Smrt',
    description: 'Pojistné plnění pro pozůstalé – splatí hypotéku, zajistí rodinu.',
    group: 'death',
    unit: 'lump',
    icon: Skull,
    color: BARVY.navy,
    moznosti: KLESAJICI_PEVNA,
  },
  {
    key: 'death_accident',
    label: 'Smrt úrazem',
    short: 'Smrt úrazem',
    description: 'Plnění pro pozůstalé navíc, když smrt způsobí úraz.',
    group: 'death',
    unit: 'lump',
    icon: Skull,
    color: BARVY.navy,
    moznosti: KLESAJICI_PEVNA,
  },
]

export const RISK_GROUPS: Array<{ id: RiskGroup; label: string; subtitle: string }> = [
  { id: 'daily', label: 'Denní dávky', subtitle: 'Plnění za každý den léčení nebo nemocnice' },
  { id: 'health-events', label: 'Při zdravotní události', subtitle: 'Pojistná částka nebo dávka při diagnóze, trvalém poškození či potřebě péče' },
  { id: 'disability', label: 'Invalidita', subtitle: 'Pojistná částka podle stupně invalidity' },
  { id: 'death', label: 'Smrt', subtitle: 'Plnění pro pozůstalé' },
]

export const RISK_BY_KEY: Record<RiskKey, RiskDef> = Object.fromEntries(
  RISK_DEFS.map((r) => [r.key, r]),
) as Record<RiskKey, RiskDef>

/** Jednotka částky, jak ji klient čte u položky. */
export const JEDNOTKA_RIZIKA: Record<RiskUnit, string> = { daily: 'Kč/den', monthly: 'Kč/měsíc', lump: 'Kč' }

/** „350 Kč/den“, „2 000 000 Kč“. */
export function castkaRizika(def: RiskDef, castka: number): string {
  return `${Math.round(castka).toLocaleString('cs-CZ')} ${JEDNOTKA_RIZIKA[def.unit]}`
}

/** Zvolené volby plnění podle klíče rizika, třeba { daily_sick_leave: 'od 29. dne' }. */
export type VolbyKryti = Partial<Record<RiskKey, string>>

/** Jen známá rizika a volby z jejich nabídky – z požadavku ani z jsonb se nedá věřit ničemu jinému. */
export function ocistiVolbyKryti(vstup: unknown): VolbyKryti {
  if (!vstup || typeof vstup !== 'object' || Array.isArray(vstup)) return {}
  const zdroj = vstup as Record<string, unknown>
  const volby: VolbyKryti = {}
  for (const r of RISK_DEFS) {
    const v = zdroj[r.key]
    if (typeof v === 'string' && r.moznosti?.includes(v)) volby[r.key] = v
  }
  return volby
}

/**
 * „od 29. dne“ → 29, jinak null. U pracovní neschopnosti z volby plyne
 * karence, se kterou počítá graf života i „Co by vám pojistka zaplatila“.
 */
export function denZVolby(volba: string | undefined): number | null {
  const shoda = volba?.match(/^od (\d+)\. dne$/)
  return shoda ? Number(shoda[1]) : null
}
