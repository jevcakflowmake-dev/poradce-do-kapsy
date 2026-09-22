/**
 * Renta v důchodu: kolik bude potřeba a kolik na to odkládat.
 *
 * Nápad je ze staršího papírového plánu (ProfiFP/OVB, strana „Penze v číslech"):
 * ukázat požadovanou rentu v dnešních i v budoucích cenách, odečíst odhad
 * státního důchodu a teprve ze zbytku spočítat měsíční úložku. Čísla sem
 * chodí z analýzy, kterou klient vyplnil.
 *
 * Všechno kromě klientových údajů je PŘEDPOKLAD, ne predikce. Proto jsou
 * sazby pohromadě tady a komponenta je vypisuje pod výpočtem — klient musí
 * vidět, na čem to stojí, a poradce musí poznat, kdy to pro konkrétní případ
 * nesedí.
 */

export const PREDPOKLADY = {
  /** Dlouhodobý inflační cíl ČNB. Přepočítává dnešní částky na budoucí ceny. */
  inflace: 0.03,
  /**
   * Zhodnocení odložených peněz. Schválně níž než 7 %, se kterými počítal
   * starý plán — vyšší odhad snižuje měsíční úložku a dělá cíl snazší,
   * než jaký ve skutečnosti je. Není to slib výnosu.
   */
  zhodnoceni: 0.06,
  /** Jak dlouho má renta vydržet. */
  letVDuchodu: 20,
  /**
   * Hrubý odhad státního důchodu jako podíl současného čistého příjmu.
   * Skutečná výše závisí na odpracovaných letech a vyměřovacích základech;
   * tohle je orientační číslo do doby, než ho poradce nahradí výpočtem z ČSSZ.
   */
  nahradovyPomer: 0.4,
} as const

export interface VstupDuchod {
  /** Věk klienta dnes. */
  vek?: number
  /** Věk, ve kterém chce přestat pracovat. */
  vekOdchodu?: number
  /** Požadovaná měsíční renta v dnešních cenách. */
  pozadovanaRenta?: number
  /** Čistý měsíční příjem — z něj se odhaduje státní důchod, když ho poradce nezadal. */
  cistyPrijem?: number
  /** Očekávaný státní důchod v dnešních cenách od poradce. Má přednost před odhadem. */
  statniDuchod?: number
  /** Kolik už má na důchod odloženo. */
  jizNaspořeno?: number
  /** Kolik odkládá měsíčně teď. */
  odkladaTed?: number
}

export interface VysledekDuchod {
  roky: number
  /** V dnešních cenách. */
  dnes: { renta: number; stat: number; mezera: number; celkem: number }
  /** Přepočítané na ceny v roce odchodu do důchodu. */
  budouci: { renta: number; stat: number; mezera: number; celkem: number }
  /** Kolik z potřebné částky pokryje to, co už je odložené (i s výnosem). */
  zNaspořeného: number
  /** Kolik ještě chybí doplnit. */
  chybi: number
  /** Kolik měsíčně odkládat, aby to vyšlo. */
  mesicneOdkladat: number
  /** Kolik odkládá teď – pro porovnání. */
  odkladaTed: number
  /** Odkud se vzal státní důchod – komponenta podle toho formuluje předpoklady. */
  zdrojStatu: 'poradce' | 'odhad'
}

/** Budoucí hodnota pravidelné měsíční úložky při daném ročním zhodnocení. */
function faktorAnuity(rocniSazba: number, roky: number): number {
  const mesicni = rocniSazba / 12
  const splatek = roky * 12
  if (splatek <= 0) return 0
  if (mesicni === 0) return splatek
  return ((1 + mesicni) ** splatek - 1) / mesicni
}

/**
 * Vrátí null, když chybí něco, bez čeho by výsledek byl vymyšlený:
 * věk, věk odchodu nebo požadovaná renta. Lepší nic než falešné číslo.
 */
export function spoctiDuchod(v: VstupDuchod): VysledekDuchod | null {
  const { vek, vekOdchodu, pozadovanaRenta } = v
  if (!vek || !vekOdchodu || !pozadovanaRenta) return null
  const roky = vekOdchodu - vek
  if (roky <= 0) return null

  const { inflace, zhodnoceni, letVDuchodu, nahradovyPomer } = PREDPOKLADY
  const inflacniIndex = (1 + inflace) ** roky

  // Číslo od poradce (kalkulačka ČSSZ) je přesnější než náhradový poměr.
  const zdrojStatu: 'poradce' | 'odhad' = v.statniDuchod ? 'poradce' : 'odhad'
  const statDnes = v.statniDuchod ?? Math.round((v.cistyPrijem ?? 0) * nahradovyPomer)
  const mezeraDnes = Math.max(0, pozadovanaRenta - statDnes)

  const dnes = {
    renta: pozadovanaRenta,
    stat: statDnes,
    mezera: mezeraDnes,
    celkem: mezeraDnes * 12 * letVDuchodu,
  }

  // Státní důchod se valorizuje, proto ho posouváme stejnou inflací jako rentu.
  const budouci = {
    renta: Math.round(pozadovanaRenta * inflacniIndex),
    stat: Math.round(statDnes * inflacniIndex),
    mezera: Math.round(mezeraDnes * inflacniIndex),
    celkem: Math.round(mezeraDnes * inflacniIndex) * 12 * letVDuchodu,
  }

  const zNaspořeného = Math.round((v.jizNaspořeno ?? 0) * (1 + zhodnoceni) ** roky)
  const chybi = Math.max(0, budouci.celkem - zNaspořeného)
  const faktor = faktorAnuity(zhodnoceni, roky)

  return {
    roky,
    dnes,
    budouci,
    zNaspořeného,
    chybi,
    mesicneOdkladat: faktor > 0 ? Math.round(chybi / faktor) : 0,
    odkladaTed: v.odkladaTed ?? 0,
    zdrojStatu,
  }
}
