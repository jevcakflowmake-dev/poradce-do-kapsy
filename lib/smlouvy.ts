/**
 * Uzavřená smlouva v sekci Moje smlouvy.
 *
 * Bydlí v `proposals.content` jako JSON — tabulka `proposals` je to, co
 * sekce Moje smlouvy odjakživa vypisuje, takže nová tabulka by jen zdvojila
 * totéž. Starší řádky mají jiný, chudší tvar (`sections`); parser vrací
 * `null` a stránka je vykreslí po staru.
 *
 * Krytí ze smlouvy převedené z varianty se ukládá pod stejnými klíči jako
 * u variant plánu (`RiskKey`), aby klient viděl sjednanou smlouvu popsanou
 * přesně těmi slovy, podle kterých se v plánu rozhodoval. Ručně zadaná
 * smlouva má vlastní seznam položek (`POLOZKY_KRYTI`) – ten odpovídá tomu,
 * jak krytí stojí v pojistné smlouvě, i s volbami typu „od 8. dne“.
 */
import type { RiskKey } from './income-risks'

export interface PlatbaSmlouvy {
  /** Číslo účtu ve formátu IBAN — z něj se skládá QR platba. */
  ucet?: string
  /** Předpis částky v Kč. */
  castka?: number
  /** Variabilní symbol, obvykle číslo smlouvy. */
  vs?: string
  /** Zpráva pro příjemce. */
  zprava?: string
}

export interface ObsahSmlouvy {
  spolecnost?: string
  produkt?: string
  popis?: string
  cisloSmlouvy?: string
  /** Do jakého věku smlouva běží. */
  doVeku?: string
  /** Jak často se platí. */
  frekvence?: string
  /** Kam hlásit pojistnou událost — odkaz nebo telefon. */
  hlaseni?: string
  /** Kam psát kvůli platbám a změnám. */
  kontakt?: string
  /** Sjednané pojistné částky podle klíčů z `lib/income-risks.ts`. */
  kryti?: Partial<Record<RiskKey, number>>
  platba?: PlatbaSmlouvy
  /** Popisek u přiloženého souboru se smlouvou. */
  souborPopisek?: string
  /** Varianta plánu, ze které poradce smlouvu převedl – aby šlo poznat, co už je sjednané. */
  zVarianty?: string
  /** Krytí ručně zadané smlouvy: položka, částka a volba (třeba „od 8. dne“). */
  polozkyKryti?: PolozkaKryti[]
  /** Počátek smlouvy (RRRR-MM-DD) – od něj se počítá výročí. */
  pocatek?: string
  /** Kdy smlouva skončila (RRRR-MM-DD). Ukončená zůstává v přehledu, ale neplatí se. */
  ukonceno?: string
}

export interface PolozkaKryti {
  /** Klíč z POLOZKY_KRYTI. */
  id: string
  castka: number
  moznost?: string
}

const CASTKA_KLESAJICI_PEVNA = ['klesající pojistná částka', 'pevná pojistná částka']

/**
 * Položky krytí ve formuláři ruční smlouvy – jak je poradce zná z pojistných
 * smluv. `moznosti` jsou volby, které u položky rozhodují o plnění (od
 * kolikátého dne se platí, jestli pojistná částka klesá); dlouhodobá péče
 * žádnou nemá. Invalidita má každý stupeň zvlášť – smlouvy je často kryjí
 * různě (jen III., nebo II. a III. s jinou částkou); klíče jsou stejné jako
 * u zajištění příjmu v lib/income-risks.ts.
 */
export const POLOZKY_KRYTI: ReadonlyArray<{
  id: string
  popisek: string
  jednotka: string
  moznosti?: readonly string[]
}> = [
  { id: 'daily_compensation', popisek: 'Denní odškodné', jednotka: 'Kč/den', moznosti: ['od 1. dne', 'od 8. dne', 'od 29. dne'] },
  { id: 'hospitalization', popisek: 'Hospitalizace', jednotka: 'Kč/den', moznosti: ['od 1. dne', 'od 5. dne'] },
  { id: 'disability_1', popisek: 'Invalidita I. stupně', jednotka: 'Kč', moznosti: CASTKA_KLESAJICI_PEVNA },
  { id: 'disability_2', popisek: 'Invalidita II. stupně', jednotka: 'Kč', moznosti: CASTKA_KLESAJICI_PEVNA },
  { id: 'disability_3', popisek: 'Invalidita III. stupně', jednotka: 'Kč', moznosti: CASTKA_KLESAJICI_PEVNA },
  { id: 'permanent_consequences', popisek: 'Trvalé následky', jednotka: 'Kč', moznosti: ['od 0,001 %', 'od 10 %'] },
  { id: 'serious_illness', popisek: 'Závažná onemocnění', jednotka: 'Kč', moznosti: CASTKA_KLESAJICI_PEVNA },
  { id: 'work_incapacity', popisek: 'Pracovní neschopnost', jednotka: 'Kč/den', moznosti: ['od 14. dne', 'od 29. dne'] },
  { id: 'death', popisek: 'Smrt', jednotka: 'Kč', moznosti: CASTKA_KLESAJICI_PEVNA },
  { id: 'death_accident', popisek: 'Smrt úrazem', jednotka: 'Kč', moznosti: CASTKA_KLESAJICI_PEVNA },
  { id: 'long_term_care', popisek: 'Dlouhodobá péče', jednotka: 'Kč/měsíc' },
]

/**
 * Položky krytí z požadavku: jen známé položky s kladnou částkou a volbou
 * z nabídky dané položky – cokoliv jiného se tiše zahodí.
 */
export function ocistiPolozkyKryti(vstup: unknown): PolozkaKryti[] {
  if (!Array.isArray(vstup)) return []
  const vysledek: PolozkaKryti[] = []
  for (const polozka of POLOZKY_KRYTI) {
    const z = vstup.find((x): x is Record<string, unknown> => Boolean(x) && typeof x === 'object' && (x as Record<string, unknown>).id === polozka.id)
    const castka = Number(z?.castka)
    if (!z || !Number.isFinite(castka) || castka <= 0 || castka > 1_000_000_000) continue
    const moznost = typeof z.moznost === 'string' && polozka.moznosti?.includes(z.moznost) ? z.moznost : undefined
    vysledek.push({ id: polozka.id, castka: Math.round(castka), ...(moznost ? { moznost } : {}) })
  }
  return vysledek
}

/** Datum RRRR-MM-DD, které opravdu existuje (žádný 31. únor), jinak null. */
export function platneDatum(text: unknown): string | null {
  if (typeof text !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(text)) return null
  const d = new Date(`${text}T00:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === text ? text : null
}

/**
 * Nejbližší výročí smlouvy ode dne `od` (včetně). Počátek 29. 2. slaví
 * v nepřestupných letech 28. 2.
 */
export function dalsiVyroci(pocatek: string, od: Date): Date | null {
  if (!platneDatum(pocatek)) return null
  const [, mesic, den] = pocatek.split('-').map(Number)
  const dnes = new Date(Date.UTC(od.getUTCFullYear(), od.getUTCMonth(), od.getUTCDate()))
  for (const rok of [dnes.getUTCFullYear(), dnes.getUTCFullYear() + 1]) {
    const posledniDen = new Date(Date.UTC(rok, mesic, 0)).getUTCDate()
    const vyroci = new Date(Date.UTC(rok, mesic - 1, Math.min(den, posledniDen)))
    if (vyroci >= dnes && vyroci.getTime() > new Date(`${pocatek}T00:00:00Z`).getTime()) return vyroci
  }
  return null
}

/** Jak často se platí. Stejné hodnoty umí přepočítat součet plateb v lib/payments.ts. */
export const FREKVENCE_PLATEB = ['Měsíčně', 'Čtvrtletně', 'Pololetně', 'Ročně'] as const

export type TypSmlouvy = 'insurance' | 'pension' | 'invest'

/**
 * Do které skupiny v Moje smlouvy patří smlouva z dané oblasti plánu.
 * Bydlení chybí schválně: hypotéka není pojištění, penze ani investice
 * a v Moje smlouvy pro ni zatím není místo.
 */
export const TYP_SMLOUVY_PODLE_SEKCE: Partial<Record<string, TypSmlouvy>> = {
  income: 'insurance',
  property: 'insurance',
  children: 'insurance',
  retirement: 'pension',
  investing: 'invest',
}

/** Jedna částka z textu varianty („1 340 Kč“). Rozpětí („1 200 – 1 450 Kč“) vrací null. */
export function castkaZTextu(text: string | null | undefined): number | null {
  const cisla = (text ?? '').replace(/[\s\u00a0]/g, '').match(/\d+(?:[.,]\d+)?/g)
  if (!cisla || cisla.length !== 1) return null
  const castka = Number(cisla[0].replace(',', '.'))
  return Number.isFinite(castka) && castka > 0 ? castka : null
}

/** Zbytek po dělení 97 pro dlouhé číslo zapsané jako text (IBAN, ISO 13616). */
function mod97(cislice: string): number {
  let zbytek = 0
  for (const znak of cislice) zbytek = (zbytek * 10 + Number(znak)) % 97
  return zbytek
}

const naCislice = (text: string) => text.replace(/[A-Z]/g, (z) => String(z.charCodeAt(0) - 55))

/** Kontrolní součet českého čísla účtu (vážený mod 11) – zachytí překlep v jedné číslici. */
function ceskeCisloPlati(cislo: string, vahy: number[]): boolean {
  const cislice = cislo.padStart(vahy.length, '0')
  const soucet = vahy.reduce((s, vaha, i) => s + vaha * Number(cislice[i]), 0)
  return soucet % 11 === 0
}

/**
 * Číslo účtu na IBAN. Bere IBAN i český zápis „předčíslí-číslo/kód banky“, jak
 * ho pojišťovny píšou na smlouvy, a hlídá kontrolní součty. Překlep v čísle
 * účtu by jinak skončil QR platbou na cizí nebo neexistující účet.
 * Vrací IBAN po čtveřicích („CZ65 0800 …“), nebo null.
 */
export function naIban(vstup: string): string | null {
  const text = vstup.replace(/\s/g, '').toUpperCase()
  let iban: string | null = null

  if (/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(text)) {
    iban = mod97(naCislice(text.slice(4) + text.slice(0, 4))) === 1 ? text : null
  } else {
    const cesky = text.match(/^(?:(\d{1,6})-)?(\d{2,10})\/(\d{4})$/)
    if (!cesky) return null
    const [, predcisli = '', cislo, banka] = cesky
    if (!ceskeCisloPlati(predcisli, [10, 5, 8, 4, 2, 1])) return null
    if (!ceskeCisloPlati(cislo, [6, 3, 7, 9, 10, 5, 8, 4, 2, 1])) return null
    const bban = banka + predcisli.padStart(6, '0') + cislo.padStart(10, '0')
    const kontrola = String(98 - mod97(naCislice(bban + 'CZ00'))).padStart(2, '0')
    iban = `CZ${kontrola}${bban}`
  }

  return iban ? iban.replace(/(.{4})/g, '$1 ').trim() : null
}

/**
 * Kotva smlouvy v sekci Moje smlouvy. Přehled přes ni odkazuje rovnou na
 * konkrétní smlouvu (`/dashboard/produkty#smlouva-…`) a ta se sama otevře.
 */
export function kotvaSmlouvy(id: string): string {
  return `smlouva-${id}`
}

/** Vrátí null, když jde o starší tvar nebo nečitelný JSON — stránka pak vypíše, co umí. */
export function ctiSmlouvu(content: string | null): ObsahSmlouvy | null {
  if (!content) return null
  let data: unknown
  try {
    data = JSON.parse(content)
  } catch {
    return null
  }
  if (!data || typeof data !== 'object') return null
  const o = data as Record<string, unknown>
  // Starý tvar poznáme podle `sections`; ten umí vykreslit původní komponenta.
  if (Array.isArray(o.sections)) return null
  if (!o.spolecnost && !o.produkt && !o.kryti && !o.platba && !o.polozkyKryti) return null
  return data as ObsahSmlouvy
}

/**
 * Společnost u smlouvy, jak ji zadal poradce: nová smlouva ji má v obsahu,
 * starší návrh v `company`. Bez ní null.
 */
export function spolecnostSmlouvy(content: string | null): string | null {
  const nova = ctiSmlouvu(content)?.spolecnost
  if (nova) return nova
  if (!content) return null
  try {
    const stary = JSON.parse(content) as { company?: unknown } | null
    return typeof stary?.company === 'string' && stary.company.trim() ? stary.company : null
  } catch {
    // volný text bez společnosti
    return null
  }
}

/**
 * Řetězec pro QR platbu podle standardu SPAYD (Short Payment Descriptor,
 * ČBA). Bankovní aplikace z něj předvyplní příkaz.
 *
 * Vrací null, když chybí účet nebo částka — QR kód, ze kterého by se dalo
 * zaplatit neznámo kam, je horší než žádný. Diakritika ve zprávě se
 * odstraňuje, protože ji čtečky některých bank nezvládají.
 */
export function spaydRetezec(platba: PlatbaSmlouvy | undefined): string | null {
  if (!platba?.ucet || !platba.castka) return null

  const iban = platba.ucet.replace(/\s/g, '').toUpperCase()
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(iban)) return null

  const casti = [`ACC:${iban}`, `AM:${platba.castka.toFixed(2)}`, 'CC:CZK']
  if (platba.vs) casti.push(`X-VS:${platba.vs.replace(/\D/g, '').slice(0, 10)}`)
  if (platba.zprava) casti.push(`MSG:${bezDiakritiky(platba.zprava).slice(0, 60)}`)

  return `SPD*1.0*${casti.join('*')}`
}

function bezDiakritiky(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\*/g, ' ')
}
