import type { Profile } from '@/lib/types/database'

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
