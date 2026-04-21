import type { Profile } from '@/lib/types/database'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Výpočet skóre finančního zdraví (0–100)
export function calcHealthScore(profile: Profile): number {
  let score = 0

  // Onboarding dokončen
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
  return income ? (map[income] ?? income) : '—'
}

export function familyLabel(fs: string | null): string {
  const map: Record<string, string> = {
    single: 'Single',
    partner: 'S partnerem/kou',
    family: 'Rodina s dětmi',
    single_parent: 'Samoživitel/ka',
  }
  return fs ? (map[fs] ?? fs) : '—'
}

export function riskLabel(rp: string | null): string {
  const map: Record<string, string> = {
    conservative: 'Konzervativní',
    moderate: 'Vyvážený',
    balanced: 'Dynamický',
    aggressive: 'Agresivní',
  }
  return rp ? (map[rp] ?? rp) : '—'
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

// Pipeline status klienta
export const CLIENT_STATUS_VALUES = ['novy', 'financni_plan', 'podepsano', 'servis', 'zmena'] as const
export type ClientStatusValue = (typeof CLIENT_STATUS_VALUES)[number]

export const CLIENT_STATUS_META: Record<
  ClientStatusValue,
  { label: string; dot: string; bg: string; border: string; text: string }
> = {
  novy: {
    label: 'Nový',
    dot: '#818EAF',
    bg: 'rgba(129,142,175,0.10)',
    border: 'rgba(129,142,175,0.35)',
    text: '#162459',
  },
  financni_plan: {
    label: 'Finanční plán',
    dot: '#009EE2',
    bg: 'rgba(0,158,226,0.10)',
    border: 'rgba(0,158,226,0.45)',
    text: '#0088c6',
  },
  podepsano: {
    label: 'Podepsáno',
    dot: '#16a34a',
    bg: 'rgba(22,163,74,0.10)',
    border: 'rgba(22,163,74,0.40)',
    text: '#15803d',
  },
  servis: {
    label: 'Servis',
    dot: '#f59e0b',
    bg: 'rgba(245,158,11,0.12)',
    border: 'rgba(245,158,11,0.45)',
    text: '#b45309',
  },
  zmena: {
    label: 'Změna',
    dot: '#ea580c',
    bg: 'rgba(234,88,12,0.12)',
    border: 'rgba(234,88,12,0.45)',
    text: '#c2410c',
  },
}

export function statusLabel(s: string | null | undefined): string {
  if (!s) return '—'
  return CLIENT_STATUS_META[s as ClientStatusValue]?.label ?? s
}

export function isClientStatus(s: unknown): s is ClientStatusValue {
  return typeof s === 'string' && (CLIENT_STATUS_VALUES as readonly string[]).includes(s)
}
