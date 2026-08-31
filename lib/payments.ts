/**
 * Měsíční platby odvozené z návrhů, které poradce klientovi vystavil.
 *
 * Bere se výhradně `monthly_price` z JSON obsahu návrhu – tedy číslo, které
 * poradce skutečně vyplnil. Nic se nedopočítává ani nedomýšlí.
 *
 * Číslo účtu, variabilní symbol ani termín splatnosti tu schválně nejsou:
 * aplikace je nikde nesbírá. Do 31. 8. 2026 byla na obou stránkách s produkty
 * konstanta `mockPayments` s vymyšlenými IBANy a VS, které se zobrazovaly
 * každému klientovi jako by šlo o jeho platební pokyny. Kdyby tyhle údaje
 * měly přibýt, potřebují vlastní tabulku a poradcovo zadání – ne výplň.
 */

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

function platbaZNavrhu(p: NavrhProPlatbu): Platba | null {
  if (!p.content) return null
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
