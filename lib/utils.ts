import type { Profile } from '@/lib/types/database'
import { BARVY } from '@/lib/barvy'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Výpočet skóre finančního zdraví (0–100)
export function calcHealthScore(profile: Profile): number {
  let score = 0

  // Analýza odeslaná (sloupec se z historických důvodů jmenuje
  // onboarding_completed – úvodní wizard byl 7. 8. 2026 zrušen)
  if (profile.onboarding_completed) score += 20

  // Věk vyplněn
  if (profile.age) score += 10

  // Příjem vyplněn
  if (profile.income) score += 10

  // Rodinná situace
  if (profile.family_status) score += 10

  // Počet zvolených oblastí (max 30 bodů)
  const goals = profile.goals ?? []
  score += Math.min(goals.length * 6, 30)

  // Rizikový profil
  if (profile.risk_profile) score += 20

  return Math.min(score, 100)
}

export function incomeLabel(income: string | null): string {
  const map: Record<string, string> = {
    under_20k: 'Do 20 000 Kč',
    '20k_35k': '20 000 – 35 000 Kč',
    '35k_55k': '35 000 – 55 000 Kč',
    '55k_80k': '55 000 – 80 000 Kč',
    over_80k: 'Nad 80 000 Kč',
  }
  return income ? (map[income] ?? income) : '–'
}

export function familyLabel(fs: string | null): string {
  const map: Record<string, string> = {
    single: 'Single',
    partner: 'S partnerem/kou',
    family: 'Rodina s dětmi',
    single_parent: 'Samoživitel/ka',
  }
  return fs ? (map[fs] ?? fs) : '–'
}

export function riskLabel(rp: string | null): string {
  const map: Record<string, string> = {
    conservative: 'Konzervativní',
    moderate: 'Vyvážený',
    balanced: 'Dynamický',
    aggressive: 'Agresivní',
  }
  return rp ? (map[rp] ?? rp) : '–'
}

export function goalLabel(goal: string): string {
  const map: Record<string, string> = {
    insurance: 'Pojištění',
    pension: 'Důchod',
    invest: 'Investice',
    mortgage: 'Hypotéka',
    savings: 'Stavební spoření',
  }
  return map[goal] ?? goal
}

export function proposalTypeLabel(type: string): string {
  return {
    insurance: 'Pojištění',
    pension: 'Důchod',
    invest: 'Investice',
  }[type] ?? type
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('cs-CZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(dateStr))
}

/**
 * Oslovení křestním jménem v 5. pádě.
 *
 * Řeší jen jména na -a (Petra → Petro, Honza → Honzo, Nikola → Nikolo), kde
 * je pravidlo jednoznačné. U ostatních vrací jméno beze změny: tvary jako
 * Jan → Jane nebo Tomáš → Tomáši mají tolik výjimek, že by se to častěji
 * spletlo, než trefilo, a zkomolené jméno je horší než první pád.
 */
export function osloveni(jmeno: string): string {
  const krestni = jmeno.trim().split(' ')[0]
  if (krestni.length > 2 && krestni.endsWith('a')) return krestni.slice(0, -1) + 'o'
  return krestni
}

// Tvar podle počtu: plural(n, 'klient', 'klienti', 'klientů')
export function plural(n: number, one: string, few: string, many: string): string {
  if (n === 1) return one
  if (n >= 2 && n <= 4) return few
  return many
}

// Pipeline status klienta
export const CLIENT_STATUS_VALUES = ['novy', 'financni_plan', 'podepsano', 'servis', 'zmena'] as const
export type ClientStatusValue = (typeof CLIENT_STATUS_VALUES)[number]

export const CLIENT_STATUS_META: Record<
  ClientStatusValue,
  { label: string; dot: string; bg: string; border: string; text: string }
> = {
  // Stavy se liší jen barvou tečky a podkladu, text je vždy navy – světlé
  // odstíny palety by jako text na bledém podkladu neprošly kontrastem AA.
  novy: {
    label: 'Nový',
    dot: BARVY.slate,
    bg: 'rgba(100,112,125,0.10)',
    border: 'rgba(100,112,125,0.30)',
    text: BARVY.navy,
  },
  financni_plan: {
    label: 'Finanční plán',
    dot: BARVY.navySoft,
    bg: 'rgba(27,59,90,0.10)',
    border: 'rgba(27,59,90,0.30)',
    text: BARVY.navy,
  },
  podepsano: {
    label: 'Podepsáno',
    dot: BARVY.mint,
    bg: 'rgba(31,181,143,0.12)',
    border: 'rgba(31,181,143,0.35)',
    text: BARVY.navy,
  },
  servis: {
    label: 'Servis',
    dot: BARVY.amber,
    bg: 'rgba(242,180,65,0.16)',
    border: 'rgba(242,180,65,0.40)',
    text: BARVY.navy,
  },
  zmena: {
    label: 'Změna',
    dot: BARVY.danger,
    bg: 'rgba(194,65,12,0.10)',
    border: 'rgba(194,65,12,0.30)',
    text: BARVY.navy,
  },
}

export function statusLabel(s: string | null | undefined): string {
  if (!s) return '–'
  return CLIENT_STATUS_META[s as ClientStatusValue]?.label ?? s
}

export function isClientStatus(s: unknown): s is ClientStatusValue {
  return typeof s === 'string' && (CLIENT_STATUS_VALUES as readonly string[]).includes(s)
}
