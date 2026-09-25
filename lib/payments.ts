/**
 * Měsíční platby odvozené z návrhů a smluv, které poradce klientovi vystavil.
 *
 * Bere se jen číslo, které poradce skutečně vyplnil: u staršího návrhu
 * `monthly_price`, u uzavřené smlouvy (`lib/smlouvy.ts`) předpis z platby
 * přepočtený podle frekvence. Nic se nedomýšlí – smlouva bez frekvence do
 * součtu nejde, protože nevíme, za jaké období částka je.
 *
 * Do 31. 8. 2026 byla na obou stránkách s produkty konstanta `mockPayments`
 * s vymyšlenými IBANy a VS, které se zobrazovaly každému klientovi jako by šlo
 * o jeho platební pokyny. Účet a VS dnes zadává poradce ke konkrétní smlouvě
 * a ukazuje je detail smlouvy; tady se jen sčítají částky.
 */
import { ctiSmlouvu } from './smlouvy'

export interface NavrhProPlatbu {
  id: string
  title: string
  content: string | null
}

export interface Platba {
  id: string
  title: string
  company: string | null
  logo: string | null
  monthly: number
}

/** Kolik plateb je za rok – podle toho se předpis smlouvy přepočte na měsíc. */
const PLATEB_ZA_ROK: Record<string, number> = {
  měsíčně: 12,
  čtvrtletně: 4,
  pololetně: 2,
  ročně: 1,
}

function platbaZNavrhu(p: NavrhProPlatbu): Platba | null {
  if (!p.content) return null

  const smlouva = ctiSmlouvu(p.content)
  if (smlouva) {
    // Ukončená smlouva zůstává v přehledu, ale už se neplatí.
    if (smlouva.ukonceno) return null
    const castka = smlouva.platba?.castka
    const zaRok = PLATEB_ZA_ROK[smlouva.frekvence?.trim().toLocaleLowerCase('cs') ?? '']
    if (!castka || castka <= 0 || !zaRok) return null
    return {
      id: p.id,
      title: p.title,
      company: smlouva.spolecnost ?? null,
      logo: null,
      monthly: Math.round((castka * zaRok) / 12),
    }
  }

  try {
    const parsed = JSON.parse(p.content)
    const monthly = Number(parsed?.monthly_price)
    if (!Number.isFinite(monthly) || monthly <= 0) return null
    return {
      id: p.id,
      title: p.title,
      company: parsed.company ?? null,
      logo: parsed.logo ?? null,
      monthly,
    }
  } catch {
    // volný text bez částky – do přehledu plateb nepatří
    return null
  }
}

export function mesicniPlatby(navrhy: NavrhProPlatbu[]): {
  platby: Platba[]
  celkem: number
} {
  const platby = navrhy
    .map(platbaZNavrhu)
    .filter((p): p is Platba => p !== null)
  return { platby, celkem: platby.reduce((s, p) => s + p.monthly, 0) }
}
