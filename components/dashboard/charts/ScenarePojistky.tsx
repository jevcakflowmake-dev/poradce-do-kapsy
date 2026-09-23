import {
  Check,
  Bone,
  BedDouble,
  Thermometer,
  Stethoscope,
  Bandage,
  HeartHandshake,
  Accessibility,
  House,
  type LucideIcon,
} from 'lucide-react'
import { ctiProdukt } from '@/lib/produkt-varianty'
import type { IncomeVariant } from './IncomeLifeChart'

/**
 * „Co by vám pojistka zaplatila“ — pojistné částky převedené na životní
 * situace a konkrétní peníze.
 *
 * Nahrazuje osu rizik a blok krytí, které ukazovaly stejná čísla jako
 * srovnávací tabulka, jen hůř čitelně: osa vedla čáru přes deset
 * nesouvisejících položek na logaritmické škále a bez myši z ní nešlo
 * vyčíst nic. Tabulka slouží k porovnání variant, tenhle blok k tomu,
 * aby klient pochopil, co vybraná varianta znamená pro něj.
 *
 * Situace se ukazuje, jen když ji varianta kryje – u čistě úrazové
 * pojistky tak samy zmizí nemoc a invalidita. Součty stojí na předpokladu
 * (délka léčení, neschopenky), a ten je vždy napsaný přímo u nich.
 */

interface Situace {
  klic: string
  ikona: LucideIcon
  titulek: string
  castka: string
  popis: string
  /**
   * Popis potvrzuje, že částka stačí. Zelená je jen fajfka – máta-tmavá
   * má na bílé kontrast 3,5 : 1 a jako text by AA neprošla.
   */
  dobre?: boolean
}

const kc = (n: number) => Math.round(n).toLocaleString('cs-CZ') + ' Kč'

function cislo(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null
}

/** Typická doba léčení zlomeniny nohy v tabulkách pojišťoven (5–8 týdnů). */
const DNU_LECENI_ZLOMENINY = 42
const DNU_NESCHOPENKY = 90
const DNU_V_NEMOCNICI = 7

function situace(v: IncomeVariant, zbytekHypoteky: number | null, cistyPrijem: number | null): Situace[] {
  const d = v.details ?? {}
  const vysledek: Situace[] = []

  const uraz = cislo(d.daily_accident)
  if (uraz) {
    vysledek.push({
      klic: 'uraz',
      ikona: Bone,
      titulek: 'Zlomenina, šest týdnů léčení',
      castka: `zhruba ${kc(uraz * DNU_LECENI_ZLOMENINY)}`,
      popis: `${kc(uraz)} za každý den léčení úrazu, dny určují tabulky pojišťovny`,
    })
  }

  const nemocnice = cislo(d.daily_hospitalization)
  if (nemocnice) {
    vysledek.push({
      klic: 'nemocnice',
      ikona: BedDouble,
      titulek: 'Týden v nemocnici',
      castka: kc(nemocnice * DNU_V_NEMOCNICI),
      popis: `${kc(nemocnice)} za každý den pobytu`,
    })
  }

  const pn = cislo(d.daily_sick_leave)
  if (pn) {
    const karence = cislo(d.waiting_period_days)
    vysledek.push({
      klic: 'pn',
      ikona: Thermometer,
      titulek: 'Tři měsíce na neschopence',
      // Bez karence nevíme, od kterého dne se platí – pak radši jen denní dávka.
      castka: karence !== null ? kc(pn * Math.max(0, DNU_NESCHOPENKY - karence)) : `${kc(pn)}/den`,
      popis:
        karence !== null
          ? `${kc(pn)} za každý den od ${karence}. dne, k nemocenské od státu`
          : `${kc(pn)} za každý den neschopenky, k nemocenské od státu`,
    })
  }

  const zavazna = cislo(d.serious_illness)
  if (zavazna) {
    vysledek.push({
      klic: 'zavazna',
      ikona: Stethoscope,
      titulek: 'Vážná nemoc',
      castka: kc(zavazna),
      popis: 'Rakovina, infarkt, mrtvice – jednorázově po diagnóze',
    })
  }

  const trvale = cislo(d.permanent_consequences)
  if (trvale) {
    vysledek.push({
      klic: 'trvale',
      ikona: Bandage,
      titulek: 'Úraz s trvalými následky',
      castka: `až ${kc(trvale)}`,
      popis: 'Podle rozsahu poškození, třeba ztráta funkce ruky',
    })
  }

  const pece = cislo(d.self_sufficiency)
  if (pece) {
    vysledek.push({
      klic: 'pece',
      ikona: HeartHandshake,
      titulek: 'Potřebujete péči druhých',
      castka: kc(pece),
      popis: 'Ztráta soběstačnosti – když se sami nezvládnete obléct nebo najíst',
    })
  }

  const inv3 = cislo(d.disability_3)
  if (inv3) {
    const inv1 = cislo(d.disability_1)
    const inv2 = cislo(d.disability_2)
    vysledek.push({
      klic: 'invalidita',
      ikona: Accessibility,
      titulek: 'Už nemůžete pracovat',
      castka: kc(inv3),
      popis:
        inv1 && inv2
          ? `Invalidita III. stupně, při nižším stupni ${kc(inv1)} až ${kc(inv2)}`
          : 'Invalidita III. stupně – jednorázově',
    })
  }

  const smrt = cislo(d.death)
  if (smrt) {
    let popis = 'Jednorázově vašim blízkým'
    let dobre = false
    // Kotva ve vlastním životě klienta: s čím by se rodina musela vypořádat.
    if (zbytekHypoteky) {
      if (smrt >= zbytekHypoteky) {
        popis = `Pokryje zbytek hypotéky ${kc(zbytekHypoteky)}`
        dobre = true
      } else {
        popis = `Zbytek hypotéky je ${kc(zbytekHypoteky)} – pokryje z něj ${Math.round((smrt / zbytekHypoteky) * 100)} %`
      }
    } else if (cistyPrijem) {
      const let_ = Math.floor(smrt / (cistyPrijem * 12))
      if (let_ >= 1) popis = `Odpovídá zhruba ${let_} ${let_ === 1 ? 'roku' : 'letům'} vašeho čistého příjmu`
    }
    vysledek.push({ klic: 'smrt', ikona: House, titulek: 'Když tu nebudete', castka: kc(smrt), popis, dobre })
  }

  return vysledek
}

export default function ScenarePojistky({
  variant,
  jeNahled,
  zbytekHypoteky,
  cistyPrijem,
}: {
  variant: IncomeVariant
  /** Klient ještě nevybral – ukazuje se první varianta. */
  jeNahled: boolean
  zbytekHypoteky: number | null
  cistyPrijem: number | null
}) {
  const polozky = situace(variant, zbytekHypoteky, cistyPrijem)
  if (polozky.length === 0) return null
  const produkt = ctiProdukt(variant.details)?.nazev
  const nazev = `${variant.company}${produkt ? ` ${produkt}` : ''}`

  return (
    <div className="rounded-card border border-line bg-surface p-4 md:p-6">
      <h3 className="text-navy font-display text-base font-semibold">Co by vám pojistka zaplatila</h3>
      <p className="text-xs text-slate mt-0.5">
        {jeNahled ? (
          <>
            Náhled podle varianty <strong className="text-navy">{nazev}</strong> – po výběru se tu ukáže
            ta vaše.
          </>
        ) : (
          <>
            Podle vybrané varianty <strong className="text-navy">{nazev}</strong>.
          </>
        )}
      </p>

      <ul className="mt-3">
        {polozky.map((s) => (
          <li
            key={s.klic}
            className="grid grid-cols-[2.5rem_minmax(0,1fr)] sm:grid-cols-[2.5rem_minmax(0,1fr)_auto] gap-x-3 gap-y-0.5 items-center py-3.5 border-t border-line first:border-t-0"
          >
            <span
              aria-hidden
              className="row-span-3 sm:row-span-2 w-10 h-10 rounded-input bg-cream flex items-center justify-center"
            >
              <s.ikona className="w-5 h-5 text-navy" strokeWidth={1.8} />
            </span>
            <span className="text-base font-semibold text-navy">{s.titulek}</span>
            {/* Na telefonu částka pod nadpis, na širším displeji doprava. */}
            <span className="font-display text-navy text-lead tabular-nums sm:row-span-2 sm:text-right sm:col-start-3 sm:row-start-1">
              {s.castka}
            </span>
            <span className={`text-sm ${s.dobre ? 'text-navy font-medium' : 'text-slate'} text-pretty`}>
              {s.dobre && (
                <Check className="inline w-4 h-4 text-mint-dark mr-1 -mt-0.5" strokeWidth={2.5} aria-hidden />
              )}
              {s.popis}
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-2 pt-3 border-t border-line text-xs text-slate text-pretty">
        Částky jsou orientační. Co přesně se vyplatí, určují pojistné podmínky – u úrazu třeba tabulky
        doby léčení.
      </p>
    </div>
  )
}
