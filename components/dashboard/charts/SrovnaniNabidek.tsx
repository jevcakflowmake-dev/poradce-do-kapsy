'use client'

import { Fragment, useId } from 'react'
import { Check } from 'lucide-react'

/**
 * Srovnání nabídek vedle sebe z volně zadaných parametrů varianty – dnes
 * u Bydlení (refinancování hypotéky). Dřív měla každá nabídka rozklikávací
 * kartu a sazby dvou bank šlo porovnat jen přeskakováním mezi nimi.
 *
 * Parametry píše poradce jako text a každá banka může mít jiné („Poplatky
 * za refinancování“ u jedné, „Odhad nemovitosti“ u druhé), takže řádky jsou
 * sjednocení všech popisků; kde nabídka parametr nemá, je pomlčka.
 *
 * Sloupec „Teď“ ukazuje současnou hypotéku z analýzy – u refinancování se
 * rozhoduje hlavně podle toho, kolik oproti dnešku klient ušetří. Do
 * zvýraznění výhodnější hodnoty se nepočítá, vybrat ho nejde.
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

type Smer = 'nizsi' | 'vyssi'

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
function smerPodlePopisku(popisek: string): Smer | null {
  if (/ušetří|úspor|výnos|zhodnocen/i.test(popisek)) return 'vyssi'
  if (/sazb|úrok|splátk|poplat|rpsn|cena|náklad/i.test(popisek)) return 'nizsi'
  return null
}

const JE_SPLATKA = /splátk/i
const JE_SAZBA = /sazb|úrok/i

function sestavRadky(nabidky: Nabidka[], ted: SoucasnaHypoteka | null): Radek[] {
  const radky: Radek[] = []

  // Splátka první a vždy – je to hlavní číslo nabídky. Poznámku k ní („o 1 520 Kč
  // méně než teď“) vynecháme, když stejnou věc říká řádek s úsporou.
  radky.push({
    klic: 'splatka',
    popisek: 'Měsíční splátka',
    bunky: nabidky.map((n) => {
      const parametr = Object.entries(n.params).find(([popisek]) => JE_SPLATKA.test(popisek))?.[1]
      return {
        text: n.monthlyPayment,
        poznamka: ted?.splatka ? undefined : parametr?.note || undefined,
        cislo: cisloZTextu(n.monthlyPayment),
      }
    }),
    ted: ted?.splatka ? kc(ted.splatka) : undefined,
    smer: 'nizsi',
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

  // Ostatní parametry v pořadí, jak je poradce zadal; bez splátky, ta už je nahoře.
  const popisky: string[] = []
  for (const n of nabidky) {
    for (const popisek of Object.keys(n.params)) {
      if (!JE_SPLATKA.test(popisek) && !popisky.includes(popisek)) popisky.push(popisek)
    }
  }
  for (const popisek of popisky) {
    radky.push({
      klic: `p-${popisek}`,
      popisek,
      bunky: nabidky.map((n) => {
        const p = n.params[popisek]
        return p ? { text: p.value, poznamka: p.note || undefined, cislo: cisloZTextu(p.value) } : { text: '–', cislo: null }
      }),
      ted: JE_SAZBA.test(popisek) && ted?.sazba ? `${ted.sazba.toLocaleString('cs-CZ')} % p. a.` : undefined,
      smer: smerPodlePopisku(popisek),
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
  ted,
  barvy,
  selectedId,
}: {
  nabidky: Nabidka[]
  /** Současná hypotéka z analýzy; bez ní sloupec Teď chybí. */
  ted: SoucasnaHypoteka | null
  barvy: string[]
  selectedId: string | null
}) {
  const uid = useId()
  const sTed = Boolean(ted?.splatka || ted?.sazba)
  const radky = sestavRadky(nabidky, sTed ? ted : null)
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
        <h3 className="text-navy font-display text-base font-semibold">Srovnání nabídek</h3>
        <p className="text-xs text-slate mt-0.5 text-pretty">
          V každém řádku je zvýrazněná výhodnější hodnota.
          {sTed && <span className="hidden sm:inline"> Sloupec Teď je vaše současná hypotéka podle analýzy.</span>}
        </p>
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
                    <div className="flex items-center gap-2.5">
                      {/* Na telefonu bez loga: se sloupcem Teď by se tři nabídky vedle sebe nevešly. */}
                      <span
                        aria-hidden
                        className="hidden sm:flex w-8 h-8 rounded-card items-center justify-center text-white text-sm font-bold shrink-0"
                        style={{ background: barvy[i % barvy.length] }}
                      >
                        {n.logo}
                      </span>
                      <span className="min-w-0">
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
