/**
 * Uzavřená smlouva v sekci Moje smlouvy.
 *
 * Bydlí v `proposals.content` jako JSON — tabulka `proposals` je to, co
 * sekce Moje smlouvy odjakživa vypisuje, takže nová tabulka by jen zdvojila
 * totéž. Starší řádky mají jiný, chudší tvar (`sections`); parser vrací
 * `null` a stránka je vykreslí po staru.
 *
 * Krytí se ukládá pod stejnými klíči jako u variant plánu (`RiskKey`), aby
 * klient viděl sjednanou smlouvu popsanou přesně těmi slovy, podle kterých
 * se v plánu rozhodoval.
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
  if (!o.spolecnost && !o.produkt && !o.kryti && !o.platba) return null
  return data as ObsahSmlouvy
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
