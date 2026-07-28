/**
 * Definice 10 typů pojistného krytí v sekci "Zajištění příjmu".
 * Sdílené mezi advisor editorem a klient zobrazením.
 *
 * Group "daily" — denní dávky (Kč/den)
 * Group "lump"  — jednorázové pojistné částky (Kč)
 */

import {
  Activity, BedDouble, Bandage, Heart, Stethoscope,
  ShieldAlert, ShieldX, AlertOctagon, Accessibility, Skull,
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
  | 'death'

export type RiskUnit = 'daily' | 'lump'
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
}

export const RISK_DEFS: RiskDef[] = [
  // ── Denní dávky ──────────────────────────────────────────
  {
    key: 'daily_accident',
    label: 'Denní odškodné — úraz',
    short: 'Úraz',
    description: 'Vyplácí se za každý den léčení úrazu (zlomenina, popálenina, distorze…).',
    group: 'daily',
    unit: 'daily',
    icon: Bandage,
    color: '#009EE2',
  },
  {
    key: 'daily_sick_leave',
    label: 'Pracovní neschopenka',
    short: 'PN',
    description: 'Doplňuje příjem při nemoci nebo úrazu, když ti klesne na ~60 %.',
    group: 'daily',
    unit: 'daily',
    icon: Activity,
    color: '#009EE2',
  },
  {
    key: 'daily_hospitalization',
    label: 'Hospitalizace',
    short: 'Nemocnice',
    description: 'Denní dávka za pobyt v nemocnici — kryje další náklady navíc k PN.',
    group: 'daily',
    unit: 'daily',
    icon: BedDouble,
    color: '#009EE2',
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
    color: '#162459',
  },
  {
    key: 'serious_illness',
    label: 'Závažné onemocnění',
    short: 'Závažné onem.',
    description: 'Jednorázová částka při diagnóze (rakovina, infarkt, mrtvice, transplantace…).',
    group: 'health-events',
    unit: 'lump',
    icon: Stethoscope,
    color: '#162459',
  },
  {
    key: 'self_sufficiency',
    label: 'Ztráta soběstačnosti',
    short: 'Soběstačnost',
    description: 'Jednorázová částka při neschopnosti se sám o sebe postarat (denní úkony).',
    group: 'health-events',
    unit: 'lump',
    icon: Accessibility,
    color: '#162459',
  },

  // ── Invalidita ───────────────────────────────────────────
  {
    key: 'disability_1',
    label: 'Invalidita I. stupně',
    short: 'Invalidita I.',
    description: 'Pokles pracovní schopnosti o 35–49 % — částečná invalidita.',
    group: 'disability',
    unit: 'lump',
    icon: ShieldAlert,
    color: '#b45309',
  },
  {
    key: 'disability_2',
    label: 'Invalidita II. stupně',
    short: 'Invalidita II.',
    description: 'Pokles pracovní schopnosti o 50–69 % — středně těžká invalidita.',
    group: 'disability',
    unit: 'lump',
    icon: AlertOctagon,
    color: '#b45309',
  },
  {
    key: 'disability_3',
    label: 'Invalidita III. stupně',
    short: 'Invalidita III.',
    description: 'Pokles pracovní schopnosti o 70 % a víc — plná invalidita.',
    group: 'disability',
    unit: 'lump',
    icon: ShieldX,
    color: '#b45309',
  },

  // ── Smrt ─────────────────────────────────────────────────
  {
    key: 'death',
    label: 'Smrt',
    short: 'Smrt',
    description: 'Pojistné plnění pro pozůstalé — splatí hypotéku, zajistí rodinu.',
    group: 'death',
    unit: 'lump',
    icon: Skull,
    color: '#162459',
  },
]

export const RISK_GROUPS: Array<{ id: RiskGroup; label: string; subtitle: string }> = [
  { id: 'daily', label: 'Denní dávky', subtitle: 'Plnění za každý den léčení nebo nemocnice' },
  { id: 'health-events', label: 'Jednorázové při zdravotní události', subtitle: 'Pojistná částka při diagnóze nebo trvalém poškození' },
  { id: 'disability', label: 'Invalidita', subtitle: 'Pojistná částka podle stupně invalidity' },
  { id: 'death', label: 'Smrt', subtitle: 'Plnění pro pozůstalé' },
]

export const RISK_BY_KEY: Record<RiskKey, RiskDef> = Object.fromEntries(
  RISK_DEFS.map((r) => [r.key, r]),
) as Record<RiskKey, RiskDef>
