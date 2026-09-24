/**
 * Projekce investice pro graf v plánu: poradce u varianty zadá předpokládaný
 * roční výnos, dobu a vklady, klient uvidí, jak by investice mohla růst.
 * Ukládá se do `plan_variants.details.projekce` vedle detailu produktu –
 * nový sloupec netřeba.
 *
 * Počítá se po měsících: jednorázový vklad na začátku, měsíční vklad vždy
 * na konci měsíce, úrok měsíční sazbou, která za rok dá přesně zadaný výnos
 * ((1 + r)^(1/12) − 1). Pevný výnos je model, ne předpověď – tak to stojí
 * i pod grafem.
 */

export interface ProjekceInvestice {
  /** Předpokládaný roční výnos v procentech, třeba 8 nebo 6,5. */
  vynos: number
  /** Doba v celých letech. */
  roky: number
  /** Měsíční vklad v Kč. */
  mesicne: number
  /** Jednorázový vklad na začátku v Kč. */
  jednorazove: number
}

/** Oblasti plánu, kde poradce může graf zadat. Děti jdou přidat sem. */
export const SEKCE_S_PROJEKCI: readonly string[] = ['investing', 'retirement']

const LIMITY = {
  vynos: [0, 30],
  roky: [1, 50],
  mesicne: [0, 1_000_000],
  jednorazove: [0, 100_000_000],
} as const

/** „8“, „6,5“, „3 000“ i číslo → number; prázdné nebo nesmysl → null. */
export function cisloZVstupu(hodnota: unknown): number | null {
  if (typeof hodnota === 'number') return Number.isFinite(hodnota) ? hodnota : null
  if (typeof hodnota !== 'string') return null
  const text = hodnota.replace(/[\s ]/g, '').replace(',', '.')
  if (!text) return null
  const n = Number(text)
  return Number.isFinite(n) ? n : null
}

/**
 * Projekce z požadavku nebo z databáze, nebo null, když nedává smysl –
 * chybí výnos či doba, hodnoty mimo rozumné meze, nebo není co investovat.
 */
export function ocistiProjekci(vstup: unknown): ProjekceInvestice | null {
  if (!vstup || typeof vstup !== 'object') return null
  const o = vstup as Record<string, unknown>
  const vynos = cisloZVstupu(o.vynos)
  const roky = cisloZVstupu(o.roky)
  const mesicne = cisloZVstupu(o.mesicne) ?? 0
  const jednorazove = cisloZVstupu(o.jednorazove) ?? 0
  const vMezich = (n: number, [od, do_]: readonly [number, number]) => n >= od && n <= do_
  if (vynos === null || roky === null || !Number.isInteger(roky)) return null
  if (!vMezich(vynos, LIMITY.vynos) || !vMezich(roky, LIMITY.roky)) return null
  if (!vMezich(mesicne, LIMITY.mesicne) || !vMezich(jednorazove, LIMITY.jednorazove)) return null
  if (mesicne + jednorazove <= 0) return null
  return {
    vynos: Math.round(vynos * 100) / 100,
    roky,
    mesicne: Math.round(mesicne),
    jednorazove: Math.round(jednorazove),
  }
}

/** Projekce uložená u varianty plánu, nebo null. */
export function ctiProjekci(details: unknown): ProjekceInvestice | null {
  if (!details || typeof details !== 'object') return null
  return ocistiProjekci((details as Record<string, unknown>).projekce)
}

export interface BodProjekce {
  rok: number
  /** Kolik klient do té doby vložil. */
  vlozeno: number
  /** Předpokládaná hodnota investice. */
  hodnota: number
}

/**
 * Odhad na koruny přesně („860 736 Kč“) by sliboval přesnost, kterou pevný
 * výnos nemá. Nad sto tisíc na tisíce, pod tím na stovky.
 */
export function zaokrouhliOdhad(n: number): number {
  return n >= 100_000 ? Math.round(n / 1_000) * 1_000 : Math.round(n / 100) * 100
}

/**
 * Vývoj po letech (od roku 0) a výsledek na konci doby. Hodnota je
 * zaokrouhlený odhad, vloženo přesně; výnos je jejich rozdíl, ať čísla sedí.
 */
export function spoctiProjekci(p: ProjekceInvestice): {
  body: BodProjekce[]
  vlozeno: number
  hodnota: number
  vynosKc: number
} {
  const mesicniSazba = Math.pow(1 + p.vynos / 100, 1 / 12) - 1
  let hodnota = p.jednorazove
  const body: BodProjekce[] = [{ rok: 0, vlozeno: p.jednorazove, hodnota: p.jednorazove }]
  for (let mesic = 1; mesic <= p.roky * 12; mesic++) {
    hodnota = hodnota * (1 + mesicniSazba) + p.mesicne
    if (mesic % 12 === 0) {
      const rok = mesic / 12
      body.push({ rok, vlozeno: p.jednorazove + p.mesicne * mesic, hodnota: zaokrouhliOdhad(hodnota) })
    }
  }
  const konec = body[body.length - 1]
  return { body, vlozeno: konec.vlozeno, hodnota: konec.hodnota, vynosKc: konec.hodnota - konec.vlozeno }
}
