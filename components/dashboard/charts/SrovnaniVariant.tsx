'use client'

import { Fragment, useId } from 'react'
import { Check } from 'lucide-react'
import { RISK_DEFS, RISK_GROUPS } from '@/lib/income-risks'
import { ctiProdukt } from '@/lib/produkt-varianty'
import { plural } from '@/lib/utils'
import LogoFirmy from '@/components/partneri/LogoFirmy'
import type { IncomeVariant } from './IncomeLifeChart'

/**
 * Srovnání variant zajištění příjmu vedle sebe: řádky jsou parametry,
 * sloupce varianty. Dřív měla každá varianta vlastní kartu jen s pěti údaji
 * a pojistné částky byly až ve zvláštním bloku pod nimi — porovnat dvě
 * nabídky znamenalo přeskakovat očima mezi kartami.
 *
 * V každém řádku je zvýrazněná výhodnější hodnota. U ceny a čekací doby je
 * výhodnější ta nižší, u všeho ostatního vyšší. Je to srovnání parametr po
 * parametru, ne doporučení celé varianty — o tom rozhoduje klient.
 */

type Smer = 'vyssi' | 'nizsi'

interface Radek {
  klic: string
  popisek: string
  hodnota: (v: IncomeVariant) => number | null
  zobraz: (v: IncomeVariant, n: number) => string
  smer: Smer
}

interface Skupina {
  id: string
  nazev: string
  radky: Radek[]
}

const kc = (n: number) => Math.round(n).toLocaleString('cs-CZ') + ' Kč'

/** „1 340 Kč“ → 1340. Cenu poradce zadává jako text, pro srovnání potřebujeme číslo. */
function castkaZTextu(text: string): number | null {
  const n = Number.parseFloat(text.replace(/\s/g, '').replace(/[^\d,.-]/g, '').replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

function cislo(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}

const ZAKLAD: Skupina = {
  id: 'zaklad',
  nazev: 'Cena a výplata',
  radky: [
    {
      klic: 'cena',
      popisek: 'Měsíční pojistné',
      hodnota: (v) => castkaZTextu(v.monthly_payment),
      zobraz: (v) => v.monthly_payment,
      smer: 'nizsi',
    },
    {
      klic: 'payout_60',
      popisek: 'Měsíčně vyplatí při poklesu na 60 %',
      hodnota: (v) => cislo(v.details?.payout_60),
      zobraz: (_v, n) => `+${kc(n)}`,
      smer: 'vyssi',
    },
    {
      klic: 'payout_50',
      popisek: 'Měsíčně vyplatí při poklesu na 50 %',
      hodnota: (v) => cislo(v.details?.payout_50),
      zobraz: (_v, n) => `+${kc(n)}`,
      smer: 'vyssi',
    },
    {
      klic: 'karence',
      popisek: 'Čekací doba (karence)',
      hodnota: (v) => cislo(v.details?.waiting_period_days),
      zobraz: (_v, n) => `${n} ${plural(n, 'den', 'dny', 'dní')}`,
      smer: 'nizsi',
    },
    {
      klic: 'delka',
      popisek: 'Nejdéle vyplácí',
      hodnota: (v) => cislo(v.details?.max_payout_years),
      zobraz: (_v, n) => `${n} ${plural(n, 'rok', 'roky', 'let')}`,
      smer: 'vyssi',
    },
  ],
}

const SKUPINY_RIZIK: Skupina[] = RISK_GROUPS.map((g) => ({
  id: g.id,
  nazev: g.label,
  radky: RISK_DEFS.filter((r) => r.group === g.id).map((r) => ({
    klic: r.key,
    popisek: r.label,
    hodnota: (v: IncomeVariant) => cislo(v.details?.[r.key]),
    zobraz: (_v: IncomeVariant, n: number) => (r.unit === 'daily' ? `${kc(n)}/den` : kc(n)),
    smer: 'vyssi' as const,
  })),
}))

/** Hodnota, kterou v řádku zvýraznit – jen když se varianty liší. */
function nejlepsi(radek: Radek, varianty: IncomeVariant[]): number | null {
  const hodnoty = varianty.map(radek.hodnota).filter((n): n is number => n !== null)
  if (hodnoty.length < 2 || hodnoty.every((n) => n === hodnoty[0])) return null
  return radek.smer === 'vyssi' ? Math.max(...hodnoty) : Math.min(...hodnoty)
}

export default function SrovnaniVariant({
  variants,
  selectedId,
}: {
  variants: IncomeVariant[]
  selectedId: string | null
}) {
  const uid = useId()
  const skupiny = [ZAKLAD, ...SKUPINY_RIZIK]
    .map((s) => ({
      ...s,
      // Řádek, který nemá vyplněný žádná varianta, jen zabírá místo.
      radky: s.radky.filter((r) => variants.some((v) => r.hodnota(v) !== null)),
    }))
    .filter((s) => s.radky.length > 0)

  return (
    <div className="rounded-card border border-line bg-surface">
      <div className="px-4 md:px-6 pt-4 md:pt-5">
        <h3 className="text-navy font-display text-base font-semibold">Srovnání variant</h3>
        <p className="text-xs text-slate mt-0.5">
          V každém řádku je zvýrazněná výhodnější hodnota. Která varianta je pro vás celkově lepší,
          záleží na tom, co upřednostníte.
        </p>
      </div>

      {/* Na telefonu jde popisek parametru nad hodnoty, aby byly obě varianty
          vidět vedle sebe – vedle sebe s popiskem by se tam nevešly a druhá
          varianta by byla schovaná za rolováním. Kdyby variant bylo víc, smí
          tabulka rolovat do strany, stránka ne. */}
      <div className="overflow-x-auto mt-3">
        <table className="w-full sm:min-w-[30rem] text-sm border-collapse">
          <thead>
            <tr className="border-b border-line">
              <th scope="col" className="hidden sm:table-cell sticky left-0 bg-surface text-left font-normal text-slate px-4 md:px-6 py-3 w-[38%]">
                <span className="sr-only">Parametr</span>
              </th>
              {variants.map((v, i) => {
                const produkt = ctiProdukt(v.details)?.nazev
                const vybrana = v.id === selectedId
                return (
                  <th key={v.id} id={`${uid}-v-${v.id}`} scope="col" className={`text-left font-normal px-2 sm:px-3 ${i === 0 ? 'pl-4 sm:pl-3' : ''} py-3 align-bottom ${vybrana ? 'bg-mint/8' : ''}`}>
                    {/* Logo nad názvem, ne vedle: se třemi variantami by vedle loga na
                        název zbylo pár pixelů. Na telefonu bez loga – sloupce jsou úzké. */}
                    <div className="flex flex-col items-start gap-2">
                      <LogoFirmy firma={v.company} nahrada={v.logo} className="hidden sm:flex" />
                      <span className="min-w-0 max-w-full">
                        <span className="block font-semibold text-navy leading-tight">{v.company}</span>
                        <span className="block text-xs text-slate truncate">{produkt ?? `Varianta ${i + 1}`}</span>
                      </span>
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>

          {skupiny.map((s) => (
            <tbody key={s.id}>
              {/* colSpan musí sedět s počtem viditelných sloupců: na telefonu
                  sloupec popisků chybí a přečnívající colSpan by přidal
                  prázdný sloupec, který tabulku roztáhne do strany. */}
              <tr className="sm:hidden">
                <th
                  scope="colgroup"
                  colSpan={variants.length}
                  className="text-left text-xs uppercase tracking-[0.15em] text-slate font-semibold px-4 pt-5 pb-1.5"
                >
                  {s.nazev}
                </th>
              </tr>
              <tr className="hidden sm:table-row">
                <th
                  scope="colgroup"
                  colSpan={variants.length + 1}
                  className="sticky left-0 bg-surface text-left text-xs uppercase tracking-[0.15em] text-slate font-semibold px-4 md:px-6 pt-5 pb-1.5"
                >
                  {s.nazev}
                </th>
              </tr>
              {s.radky.map((r) => {
                const vitez = nejlepsi(r, variants)
                return (
                  <Fragment key={r.klic}>
                  {/* Na telefonu popisek nad hodnotami. Skrytá hlavička řádku
                      přes sr-only tu nejde: absolutně pozicovaná buňka v Chromu
                      dál zabírá místo ve sloupcích a hodnoty pak ujedou pod
                      hlavičku vedlejší varianty. Proto display:none a vazbu
                      na popisek drží atribut `headers` u buněk. */}
                  <tr className="sm:hidden border-t border-line/70">
                    <th id={`${uid}-r-${r.klic}-m`} colSpan={variants.length} className="px-4 pt-2.5 text-left font-normal text-slate">
                      {r.popisek}
                    </th>
                  </tr>
                  <tr className="sm:border-t sm:border-line/70">
                    <th id={`${uid}-r-${r.klic}-d`} scope="row" className="hidden sm:table-cell sm:sticky sm:left-0 bg-surface text-left font-normal text-slate px-4 md:px-6 py-2.5">
                      {r.popisek}
                    </th>
                    {variants.map((v) => {
                      const n = r.hodnota(v)
                      const jeVitez = vitez !== null && n === vitez
                      const vybrana = v.id === selectedId
                      return (
                        <td
                          key={v.id}
                          headers={`${uid}-v-${v.id} ${uid}-r-${r.klic}-m ${uid}-r-${r.klic}-d`}
                          className={`px-2 sm:px-3 first-of-type:pl-4 sm:first-of-type:pl-3 pt-1 pb-2.5 sm:py-2.5 tabular-nums whitespace-nowrap ${
                            jeVitez ? 'font-semibold text-navy' : 'text-navy/80'
                          } ${vybrana ? 'bg-mint/8' : ''}`}
                        >
                          {n === null ? (
                            <span className="text-slate">–</span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5">
                              {r.zobraz(v, n)}
                              {jeVitez && (
                                <>
                                  <Check className="w-3.5 h-3.5 text-mint-dark" strokeWidth={2.5} aria-hidden />
                                  <span className="sr-only">(výhodnější)</span>
                                </>
                              )}
                            </span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                  </Fragment>
                )
              })}
            </tbody>
          ))}
        </table>
      </div>
      <div className="h-4 md:h-5" />
    </div>
  )
}

/** Co volba varianty potřebuje vědět – zajištění příjmu i hypotéky. */
export interface VolbaVarianty {
  id: string
  company: string
  logo: string
  monthly_payment: string
  /** Název produktu, když ho poradce vyplnil. */
  produkt?: string
}

/**
 * Volba varianty pod srovnáním. Radio skupina: vybrat jde jen jednu, protože
 * dvě pojistky na totéž riziko ani dvě hypotéky na jeden byt nedávají smysl.
 * Kliknutí na už vybranou nic nedělá — zrušení výběru má vlastní tlačítko,
 * ať se nedá odkliknout omylem.
 */
export function VyberVarianty({
  variants,
  selectedId,
  onSelect,
  nadpis = 'Kterou variantu chcete?',
}: {
  variants: VolbaVarianty[]
  selectedId: string | null
  onSelect: (id: string) => void
  nadpis?: string
}) {
  // Na stránce plánu má volbu každá oblast s nabídkami – pevné id by se opakovalo.
  const idNadpisu = useId()
  return (
    <div className="rounded-card border border-line bg-surface p-4 md:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h3 id={idNadpisu} className="text-navy font-display text-base font-semibold">
          {nadpis}
        </h3>
        {selectedId && (
          <button
            type="button"
            onClick={() => onSelect(selectedId)}
            className="bez-tisku text-sm text-slate underline underline-offset-4 hover:text-navy rounded-pill focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40"
          >
            Zrušit výběr
          </button>
        )}
      </div>

      {/* Jediná nabídka přes celou šířku – v polovině by se jí uřízla cena. */}
      <div
        role="radiogroup"
        aria-labelledby={idNadpisu}
        className={`mt-3 grid gap-3 ${variants.length > 1 ? 'sm:grid-cols-2' : ''}`}
      >
        {variants.map((v) => {
          const vybrana = v.id === selectedId
          const produkt = v.produkt
          return (
            <button
              key={v.id}
              type="button"
              role="radio"
              aria-checked={vybrana}
              aria-label={`${v.company}${produkt ? ` ${produkt}` : ''}, ${v.monthly_payment} měsíčně`}
              onClick={() => {
                if (!vybrana) onSelect(v.id)
              }}
              // min-w-0: položka mřížky se jinak nezmenší pod nejdelší slovo
              // podtitulku a karta přeteče – u delšího názvu produktu mimo obrazovku.
              className={`@container min-w-0 flex items-center gap-3 text-left rounded-card border-2 p-4 transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40 ${
                vybrana ? 'border-mint bg-mint/8' : 'border-line hover:border-mint/50'
              }`}
            >
              {/* Kolečko radio buttonu – vlastní, aby sedělo k paletě. */}
              <span
                aria-hidden
                className={`w-5 h-5 rounded-pill border-2 flex items-center justify-center shrink-0 ${
                  vybrana ? 'border-mint' : 'border-slate/40'
                }`}
              >
                {vybrana && <span className="w-2.5 h-2.5 rounded-pill bg-mint" />}
              </span>
              {/* Logo vedle textu, jen když se tam název vejde (kontejnerový dotaz
                  na šířku karty); v úzké kartě jde nad text – „Raiffeisenbank“
                  by vedle dlaždice přetekla. */}
              <span className="flex-1 min-w-0 flex flex-col items-start gap-2 @3xs:flex-row @3xs:items-center @3xs:gap-3">
                <LogoFirmy firma={v.company} nahrada={v.logo} />
                <span className="min-w-0 max-w-full">
                  <span className="block font-semibold text-navy">{v.company}</span>
                  {/* Zalomit, ne zkrátit: na telefonu by ze zkráceného řádku zmizela cena. */}
                  <span className="block text-sm text-slate text-pretty">
                    {produkt ? `${produkt} · ` : ''}
                    <span className="whitespace-nowrap">{v.monthly_payment}</span> měsíčně
                  </span>
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
