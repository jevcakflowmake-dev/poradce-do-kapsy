'use client'

import { Fragment, useId } from 'react'
import { Check } from 'lucide-react'
import LogoFirmy from '@/components/partneri/LogoFirmy'

/**
 * Srovnání nabídek vedle sebe z volně zadaných parametrů varianty – u všech
 * oblastí plánu kromě zajištění příjmu (to má vlastní srovnání s krytím).
 * Dřív měla každá nabídka rozklikávací kartu a porovnat dvě znamenalo
 * přeskakovat mezi nimi očima.
 *
 * Parametry píše poradce jako text a každá banka může mít jiné („Poplatky
 * za refinancování“ u jedné, „Odhad nemovitosti“ u druhé), takže řádky jsou
 * sjednocení všech popisků; kde nabídka parametr nemá, je pomlčka.
 *
 * Sloupec „Teď“ (jen u Bydlení) ukazuje současnou hypotéku z analýzy –
 * u refinancování se rozhoduje hlavně podle toho, kolik oproti dnešku klient
 * ušetří. Do zvýraznění výhodnější hodnoty se nepočítá, vybrat ho nejde.
 */

export interface Nabidka {
  id: string
  company: string
  logo: string
  monthlyPayment: string
  params: Record<string, { value: string; note: string }>
  produkt?: string
}

export interface SoucasnaHypoteka {
  banka?: string
  /** Současná měsíční splátka v Kč. */
  splatka?: number
  /** Současná úroková sazba v % p. a. */
  sazba?: number
}

export type Smer = 'nizsi' | 'vyssi'

export interface NastaveniSrovnani {
  /** Popisek řádku s cenou varianty – u hypotéky splátka, u spoření vklad. */
  popisekCeny: string
  /** U pojistného a splátky je výhodnější nižší; u vkladu to říct nejde. */
  smerCeny: Smer | null
  /** Podle popisku parametru: kdy je výhodnější nižší a kdy vyšší hodnota. */
  pravidla: { nizsi: RegExp; vyssi: RegExp }
}

/**
 * Jak číst parametry v jednotlivých oblastech. U úvěru je nižší sazba lepší,
 * u spoření vyšší; u pojištění majetku vyšší pojistná částka, ale nižší
 * spoluúčast. Popisek, který žádné pravidlo nezná – nebo sedí na obě
 * („Poplatek z výnosu“) – zůstane bez zvýraznění: radši nic než špatně.
 */
export const SROVNANI_SEKCI: Record<string, NastaveniSrovnani> = {
  housing: {
    popisekCeny: 'Měsíční splátka',
    smerCeny: 'nizsi',
    pravidla: { nizsi: /sazb|úrok|splátk|poplat|rpsn|cena|náklad/i, vyssi: /ušetří|úspor/i },
  },
  property: {
    popisekCeny: 'Pojistné měsíčně',
    smerCeny: 'nizsi',
    pravidla: {
      nizsi: /pojistné|cena|poplat|spoluúčast|náklad/i,
      vyssi: /pojistná částka|limit|plnění|krytí|vybavení|domácnost|nemovitost|stavb|odpovědnost/i,
    },
  },
  children: {
    popisekCeny: 'Měsíčně',
    smerCeny: null,
    pravidla: {
      nizsi: /poplat|náklad|cena|pojistné|spoluúčast/i,
      vyssi: /výnos|zhodnocen|úrok|sazb|pojistná částka|limit|plnění|krytí|státní příspěv/i,
    },
  },
  retirement: {
    popisekCeny: 'Měsíční vklad',
    smerCeny: null,
    pravidla: {
      nizsi: /poplat|náklad/i,
      vyssi: /výnos|zhodnocen|úrok|sazb|státní příspěv|příspěvek státu|příspěvek zaměstnavatel/i,
    },
  },
  investing: {
    popisekCeny: 'Měsíční vklad',
    smerCeny: null,
    pravidla: { nizsi: /poplat|náklad/i, vyssi: /výnos|zhodnocen/i },
  },
}

export const SROVNANI_VYCHOZI: NastaveniSrovnani = {
  popisekCeny: 'Měsíční platba',
  smerCeny: null,
  pravidla: { nizsi: /poplat|náklad|cena/i, vyssi: /výnos|zhodnocen/i },
}

interface Bunka {
  text: string
  poznamka?: string
  cislo: number | null
}

interface Radek {
  klic: string
  popisek: string
  bunky: Bunka[]
  /** Hodnota ve sloupci Teď, když ji z analýzy známe. */
  ted?: string
  smer: Smer | null
}

const kc = (n: number) => Math.round(n).toLocaleString('cs-CZ') + ' Kč'

/** „4,49 % p. a.“ → 4.49, „16 480 Kč“ → 16480, „zdarma“ → 0. Bez čísla null. */
function cisloZTextu(text: string): number | null {
  if (/zdarma|bez poplatk/i.test(text)) return 0
  const nalez = text.replace(/[\s ]/g, '').match(/-?\d+(?:[.,]\d+)?/)
  return nalez ? Number(nalez[0].replace(',', '.')) : null
}

/**
 * Kterým směrem je hodnota výhodnější, podle popisku parametru. Co nejde
 * poznat (třeba fixace – delší není vždy lepší), zůstane bez zvýraznění.
 */
function smerPodlePopisku(popisek: string, pravidla: NastaveniSrovnani['pravidla']): Smer | null {
  const nizsi = pravidla.nizsi.test(popisek)
  const vyssi = pravidla.vyssi.test(popisek)
  return nizsi && !vyssi ? 'nizsi' : vyssi && !nizsi ? 'vyssi' : null
}

/**
 * Parametr, který jen opakuje cenu nabídky („Měsíční splátka 16 480 Kč“ vedle
 * ceny 16 480 Kč, „Měsíční investice“ u Investic) – v tabulce by byl dvakrát.
 * Popisek musí znít jako platba: příspěvek zaměstnavatele, který náhodou
 * vyjde stejně jako vklad, zůstane vidět.
 */
const ZNI_JAKO_PLATBA = /měsíč|splátk|vklad|pojistné|platb|investic/i

function opakujeCenu(popisek: string, nabidky: Nabidka[]): boolean {
  const s = nabidky.filter((n) => n.params[popisek])
  return (
    ZNI_JAKO_PLATBA.test(popisek) &&
    s.length > 0 &&
    s.every((n) => {
      const hodnota = cisloZTextu(n.params[popisek].value)
      return hodnota !== null && hodnota === cisloZTextu(n.monthlyPayment)
    })
  )
}

const JE_SAZBA = /sazb|úrok/i

function sestavRadky(nabidky: Nabidka[], ted: SoucasnaHypoteka | null, nastaveni: NastaveniSrovnani): Radek[] {
  const radky: Radek[] = []

  // Parametry v pořadí, jak je poradce zadal (sjednocení přes nabídky).
  const popisky: string[] = []
  for (const n of nabidky) {
    for (const popisek of Object.keys(n.params)) if (!popisky.includes(popisek)) popisky.push(popisek)
  }
  const cenove = popisky.filter((p) => opakujeCenu(p, nabidky))

  // Cena první a vždy – je to hlavní číslo nabídky. Poznámku z parametru, který
  // ji opakuje, převezmeme – kromě hypotéky se sloupcem Teď, kde „o 1 520 Kč
  // méně než teď“ říká řádek s úsporou.
  radky.push({
    klic: 'cena',
    popisek: nastaveni.popisekCeny,
    bunky: nabidky.map((n) => {
      const poznamka = cenove.map((p) => n.params[p]?.note).find(Boolean)
      return {
        text: n.monthlyPayment,
        poznamka: ted?.splatka ? undefined : poznamka || undefined,
        cislo: cisloZTextu(n.monthlyPayment),
      }
    }),
    ted: ted?.splatka ? kc(ted.splatka) : undefined,
    smer: nastaveni.smerCeny,
  })

  if (ted?.splatka) {
    const splatkaTed = ted.splatka
    radky.push({
      klic: 'uspora',
      popisek: 'Ušetříte měsíčně',
      bunky: nabidky.map((n) => {
        const nova = cisloZTextu(n.monthlyPayment)
        if (nova === null) return { text: '–', cislo: null }
        const rozdil = splatkaTed - nova
        return rozdil >= 0
          ? { text: kc(rozdil), poznamka: rozdil > 0 ? `ročně ${kc(rozdil * 12)}` : undefined, cislo: rozdil }
          : { text: `o ${kc(-rozdil)} víc`, cislo: rozdil }
      }),
      smer: 'vyssi',
    })
  }

  for (const popisek of popisky) {
    if (cenove.includes(popisek)) continue
    radky.push({
      klic: `p-${popisek}`,
      popisek,
      bunky: nabidky.map((n) => {
        const p = n.params[popisek]
        return p ? { text: p.value, poznamka: p.note || undefined, cislo: cisloZTextu(p.value) } : { text: '–', cislo: null }
      }),
      ted: JE_SAZBA.test(popisek) && ted?.sazba ? `${ted.sazba.toLocaleString('cs-CZ')} % p. a.` : undefined,
      smer: smerPodlePopisku(popisek, nastaveni.pravidla),
    })
  }

  return radky
}

/** Hodnota, kterou v řádku zvýraznit – jen když ji mají aspoň dvě nabídky a liší se. */
function nejlepsi(radek: Radek): number | null {
  if (!radek.smer) return null
  const hodnoty = radek.bunky.map((b) => b.cislo).filter((n): n is number => n !== null)
  if (hodnoty.length < 2 || hodnoty.every((n) => n === hodnoty[0])) return null
  return radek.smer === 'vyssi' ? Math.max(...hodnoty) : Math.min(...hodnoty)
}

export default function SrovnaniNabidek({
  nabidky,
  ted = null,
  selectedId,
  nastaveni = SROVNANI_VYCHOZI,
}: {
  nabidky: Nabidka[]
  /** Současná hypotéka z analýzy (jen u Bydlení); bez ní sloupec Teď chybí. */
  ted?: SoucasnaHypoteka | null
  selectedId: string | null
  nastaveni?: NastaveniSrovnani
}) {
  const uid = useId()
  const sTed = Boolean(ted?.splatka || ted?.sazba)
  const radky = sestavRadky(nabidky, sTed ? ted : null, nastaveni)
  const srovnava = nabidky.length > 1
  // Současný stav jednou větou – na telefonu místo sloupce Teď.
  const tedVeta = sTed
    ? [
        ted?.splatka && `${kc(ted.splatka)} měsíčně`,
        ted?.sazba && `sazba ${ted.sazba.toLocaleString('cs-CZ')} % p. a.`,
      ]
        .filter(Boolean)
        .join(', ')
    : null

  return (
    <div className="rounded-card border border-line bg-surface">
      <div className="px-4 md:px-6 pt-4 md:pt-5">
        {/* S jedinou nabídkou není co srovnávat – je to přehled jejích parametrů. */}
        <h3 className="text-navy font-display text-base font-semibold">
          {srovnava ? 'Srovnání nabídek' : 'Parametry nabídky'}
        </h3>
        {(srovnava || sTed) && (
          <p className="text-xs text-slate mt-0.5 text-pretty">
            {srovnava && 'V každém řádku je zvýrazněná výhodnější hodnota.'}
            {sTed && <span className="hidden sm:inline"> Sloupec Teď je vaše současná hypotéka podle analýzy.</span>}
          </p>
        )}
        {/* Na telefonu by se sloupec Teď s dvěma nabídkami nevešel – úsporu oproti
            dnešku ukazuje řádek v tabulce, sem stačí, z čeho se počítá. */}
        {tedVeta && (
          <p className="sm:hidden mt-3 rounded-input bg-cream/70 px-3 py-2 text-sm text-navy text-pretty">
            <span className="font-semibold">Teď:</span> {tedVeta}
            {ted?.banka ? ` (${ted.banka})` : ''}
          </p>
        )}
      </div>

      {/* Na telefonu jde popisek parametru nad hodnoty – vedle sebe s popiskem by
          se sloupce nevešly. Víc nabídek smí rolovat do strany, stránka ne. */}
      <div className="overflow-x-auto mt-3">
        <table className="w-full sm:min-w-[30rem] text-sm border-collapse">
          <thead>
            <tr className="border-b border-line">
              <th scope="col" className="hidden sm:table-cell sticky left-0 bg-surface text-left font-normal text-slate px-4 md:px-6 py-3 w-[30%]">
                <span className="sr-only">Parametr</span>
              </th>
              {sTed && (
                <th id={`${uid}-ted`} scope="col" className="hidden sm:table-cell text-left font-normal px-3 py-3 align-bottom bg-cream/70">
                  <span className="block font-semibold text-navy leading-tight">Teď</span>
                  {/* Zkrácení (truncate) jen od sm: v buňce tabulky na telefonu text
                      nezkrátí, ale roztáhne sloupec a tabulka pak roluje do strany. */}
                  <span className="block text-xs text-slate sm:truncate">{ted?.banka || 'současná hypotéka'}</span>
                </th>
              )}
              {nabidky.map((n, i) => {
                const vybrana = n.id === selectedId
                return (
                  <th
                    key={n.id}
                    id={`${uid}-n-${n.id}`}
                    scope="col"
                    className={`text-left font-normal px-2 sm:px-3 ${i === 0 ? 'pl-4 sm:pl-3' : ''} py-3 align-bottom ${vybrana ? 'bg-mint/8' : ''}`}
                  >
                    {/* Logo nad názvem: se třemi nabídkami by vedle loga na název zbylo
                        pár pixelů. Na telefonu bez loga – se sloupcem Teď by se tři
                        nabídky vedle sebe nevešly. */}
                    <div className="flex flex-col items-start gap-2">
                      <LogoFirmy firma={n.company} nahrada={n.logo} className="hidden sm:flex" />
                      <span className="min-w-0 max-w-full">
                        <span className="block font-semibold text-navy leading-tight">{n.company}</span>
                        <span className="block text-xs text-slate sm:truncate">{n.produkt ?? `Nabídka ${i + 1}`}</span>
                      </span>
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>

          <tbody>
            {radky.map((r) => {
              const vitez = nejlepsi(r)
              return (
                <Fragment key={r.klic}>
                  {/* Popisek na telefonu: display:none místo sr-only (to by v Chromu
                      dál zabíralo místo ve sloupcích) a vazba přes `headers`. */}
                  <tr className="sm:hidden border-t border-line/70">
                    {/* colSpan jen přes nabídky: sloupec Teď je na telefonu skrytý a delší
                        colSpan by přidal prázdný sloupec, který tabulku roztáhne. */}
                    <th id={`${uid}-r-${r.klic}-m`} colSpan={nabidky.length} className="px-4 pt-2.5 text-left font-normal text-slate">
                      {r.popisek}
                    </th>
                  </tr>
                  <tr className="sm:border-t sm:border-line/70">
                    <th id={`${uid}-r-${r.klic}-d`} scope="row" className="hidden sm:table-cell sm:sticky sm:left-0 bg-surface text-left font-normal text-slate px-4 md:px-6 py-2.5 align-top">
                      {r.popisek}
                    </th>
                    {sTed && (
                      <td
                        headers={`${uid}-ted ${uid}-r-${r.klic}-m ${uid}-r-${r.klic}-d`}
                        className="hidden sm:table-cell px-3 py-2.5 align-top tabular-nums whitespace-nowrap text-slate bg-cream/70"
                      >
                        {r.ted ?? '–'}
                      </td>
                    )}
                    {r.bunky.map((b, i) => {
                      const n = nabidky[i]
                      const jeVitez = vitez !== null && b.cislo === vitez
                      return (
                        <td
                          key={n.id}
                          headers={`${uid}-n-${n.id} ${uid}-r-${r.klic}-m ${uid}-r-${r.klic}-d`}
                          className={`px-2 sm:px-3 ${i === 0 ? 'pl-4 sm:pl-3' : ''} pt-1 pb-2.5 sm:py-2.5 align-top ${
                            n.id === selectedId ? 'bg-mint/8' : ''
                          }`}
                        >
                          {b.cislo === null && b.text === '–' ? (
                            <span className="text-slate">–</span>
                          ) : (
                            <span
                              className={`inline-flex flex-wrap items-center gap-x-1.5 tabular-nums sm:whitespace-nowrap ${
                                jeVitez ? 'font-semibold text-navy' : 'text-navy/80'
                              }`}
                            >
                              {b.text}
                              {jeVitez && (
                                <>
                                  <Check className="w-3.5 h-3.5 text-mint-dark" strokeWidth={2.5} aria-hidden />
                                  <span className="sr-only">(výhodnější)</span>
                                </>
                              )}
                            </span>
                          )}
                          {b.poznamka && <span className="block text-xs text-slate mt-0.5 text-pretty">{b.poznamka}</span>}
                        </td>
                      )
                    })}
                  </tr>
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="h-4 md:h-5" />
    </div>
  )
}
