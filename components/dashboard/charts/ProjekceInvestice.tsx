'use client'

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { BARVY } from '@/lib/barvy'
import { spoctiProjekci, type BodProjekce, type ProjekceInvestice as Projekce } from '@/lib/projekce'
import { plural } from '@/lib/utils'

/**
 * Jak by investice mohla růst – podle výnosu, doby a vkladů, které poradce
 * zadal u varianty. Nahoře tři čísla, pod nimi graf vložených peněz proti
 * předpokládané hodnotě. Čísla jsou pro čtečky i pro tisk; graf je doplněk,
 * proto je před čtečkou schovaný.
 */

const kc = (n: number) => `${Math.round(n).toLocaleString('cs-CZ')} Kč`
const procento = (n: number) => `${n.toLocaleString('cs-CZ')} %`

/** Osa Y stručně: „250 tis.“, „1,2 mil.“. */
function zkratka(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toLocaleString('cs-CZ', { maximumFractionDigits: 1 })} mil.`
  if (n >= 1_000) return `${Math.round(n / 1_000).toLocaleString('cs-CZ')} tis.`
  return String(Math.round(n))
}

const poLetech = (rok: number) =>
  rok === 0 ? 'na začátku' : `po ${rok} ${plural(rok, 'roce', 'letech', 'letech')}`

function Popisek({
  active,
  payload,
  rokZacatku,
}: {
  active?: boolean
  payload?: Array<{ payload: BodProjekce }>
  rokZacatku: number | null
}) {
  const bod = active ? payload?.[0]?.payload : undefined
  if (!bod) return null
  return (
    <div className="rounded-input border border-line bg-surface px-3 py-2 text-sm shadow-card">
      <p className="font-semibold text-navy">
        {rokZacatku !== null ? `${rokZacatku + bod.rok} · ` : ''}
        {poLetech(bod.rok)}
      </p>
      <p className="text-navy tabular-nums">Předpokládaná hodnota {kc(bod.hodnota)}</p>
      <p className="text-slate tabular-nums">Vloženo {kc(bod.vlozeno)}</p>
    </div>
  )
}

export default function ProjekceInvestice({
  firma,
  produkt,
  projekce,
  rokZacatku = null,
}: {
  firma: string
  produkt?: string
  projekce: Projekce
  /** Rok, kdy plán vznikl – osa pak ukazuje letopočty; bez něj roky od začátku. */
  rokZacatku?: number | null
}) {
  const { body, vlozeno, hodnota, vynosKc } = spoctiProjekci(projekce)
  const doba = `${projekce.roky} ${plural(projekce.roky, 'rok', 'roky', 'let')}`
  const vklady = [
    projekce.jednorazove > 0 && `jednorázově ${kc(projekce.jednorazove)}`,
    projekce.mesicne > 0 && `${kc(projekce.mesicne)} měsíčně`,
  ]
    .filter(Boolean)
    .join(' a ')

  return (
    <figure className="tisk-pohromade rounded-card border border-line bg-surface p-4 md:p-6">
      <h3 className="text-navy font-display text-base font-semibold">Jak by investice mohla růst</h3>
      <p className="text-xs text-slate mt-0.5 text-pretty">
        {firma}
        {produkt ? ` · ${produkt}` : ''} · {vklady}, předpokládaný výnos {procento(projekce.vynos)} ročně
      </p>

      <dl className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-input bg-cream px-4 py-3">
          <dt className="text-sm text-slate">Za {doba} vložíte</dt>
          <dd className="font-display text-navy text-xl tabular-nums mt-0.5">{kc(vlozeno)}</dd>
        </div>
        <div className="rounded-input bg-cream px-4 py-3">
          <dt className="text-sm text-slate">Předpokládaná hodnota</dt>
          {/* Bez „kolem“: odhad je zaokrouhlený a „předpokládaná“ to říká; v úzké dlaždici by se číslo zalomilo. */}
          <dd className="font-display text-navy text-xl tabular-nums mt-0.5">{kc(hodnota)}</dd>
        </div>
        <div className="rounded-input bg-cream px-4 py-3">
          <dt className="text-sm text-slate">Z toho výnos</dt>
          <dd className="font-display text-navy text-xl tabular-nums mt-0.5">{kc(vynosKc)}</dd>
        </div>
      </dl>

      <div aria-hidden className="mt-5 h-56 md:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={body} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid stroke={BARVY.line} vertical={false} />
            <XAxis
              dataKey="rok"
              tickFormatter={(rok: number) => (rokZacatku !== null ? String(rokZacatku + rok) : String(rok))}
              tick={{ fill: BARVY.slate, fontSize: 12 }}
              axisLine={{ stroke: BARVY.line }}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={16}
            />
            <YAxis
              tickFormatter={zkratka}
              tick={{ fill: BARVY.slate, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={60}
            />
            <Tooltip content={<Popisek rokZacatku={rokZacatku} />} cursor={{ stroke: BARVY.line }} />
            {/* Hodnota první (vzadu): s nezáporným výnosem je vždy nad vloženými penězi. */}
            <Area
              type="monotone"
              dataKey="hodnota"
              stroke={BARVY.mint}
              strokeWidth={2}
              fill={BARVY.mint}
              fillOpacity={0.15}
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="vlozeno"
              stroke={BARVY.navy}
              strokeWidth={2}
              fill={BARVY.navy}
              fillOpacity={0.08}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Vlastní legenda: vestavěná legenda recharts se na telefonu láme přes graf. */}
      <div aria-hidden className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate">
        <span className="inline-flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm bg-mint" /> Předpokládaná hodnota
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm bg-navy" /> Vloženo
        </span>
      </div>

      <figcaption className="mt-3 text-xs text-slate text-pretty">
        Modelový výpočet s pevným výnosem {procento(projekce.vynos)} ročně. Skutečný výnos se bude rok od
        roku lišit a zaručený není.
      </figcaption>
    </figure>
  )
}
