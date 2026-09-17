'use client'

import { useMemo } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts'
import { Shield, CheckCircle2 } from 'lucide-react'
import { RISK_DEFS, RISK_GROUPS, type RiskKey, type RiskDef } from '@/lib/income-risks'
import LifeRiskTimeline from './LifeRiskTimeline'
import { BARVY } from '@/lib/barvy'

type IncomeDetails = {
  payout_60?: number | null
  payout_50?: number | null
  waiting_period_days?: number | null
  max_payout_years?: number | null
  accident_pn_combine?: boolean
} & Partial<Record<RiskKey, number | null>>

export interface IncomeVariant {
  id: string
  company: string
  logo: string
  monthly_payment: string
  details: IncomeDetails | null
}

interface Props {
  monthlyIncomeNet: number | null
  variants: IncomeVariant[]
  selectedVariantId: string | null
  onSelect: (variantId: string) => void
}

const VARIANT_COLORS = [BARVY.mint, BARVY.navy, BARVY.mintDark]

function fmtCzk(n: number): string {
  return Math.round(n).toLocaleString('cs-CZ') + ' Kč'
}

export default function IncomeLifeChart({
  monthlyIncomeNet,
  variants,
  selectedVariantId,
  onSelect,
}: Props) {
  // Stacked data: per scénář + per varianta dva stacky:
  //   `zustatek_<i>` = zbytek příjmu (60 % / 50 % z monthly net)
  //   `payout_<i>`   = co pojistka dorovná (vrch stacku)
  // Plus jeden referenční sloupec "Bez pojistky" jen se zůstatkem.
  const chartData = useMemo(() => {
    const incomes = [
      { label: 'Pokles na 60 %', factor: 0.6, key: '60' as const },
      { label: 'Pokles na 50 %', factor: 0.5, key: '50' as const },
    ]

    return incomes.map(({ label, factor, key }) => {
      const remainder = Math.round((monthlyIncomeNet ?? 0) * factor)
      const row: Record<string, string | number> = {
        scenario: label,
        zustatek_bez: remainder,
      }
      variants.forEach((v, idx) => {
        const payout = key === '60' ? v.details?.payout_60 ?? 0 : v.details?.payout_50 ?? 0
        row[`zustatek_${idx}`] = remainder
        row[`payout_${idx}`] = Math.max(0, Math.round(payout ?? 0))
      })
      return row
    })
  }, [monthlyIncomeNet, variants])

  // Selected variant payout summary
  const selected = useMemo(
    () => (selectedVariantId ? variants.find((v) => v.id === selectedVariantId) : null),
    [selectedVariantId, variants],
  )

  // Až za hooky: dřív tu byl brzký návrat a `useMemo` výš se pak volaly
  // podmíněně – při prvním naplnění dat by se pořadí hooků změnilo.
  if (!monthlyIncomeNet || variants.length === 0) {
    return (
      <div className="rounded-card border border-dashed border-line p-8 text-center">
        <p className="text-sm text-slate">
          {!monthlyIncomeNet
            ? 'Poradce zatím nenastavil tvůj příjem v plánu.'
            : 'Žádná varianta zatím není k dispozici.'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header s referencí */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div>
          <h3 className="text-navy font-display text-base font-semibold">Co se stane, když ti klesne příjem?</h3>
          <p className="text-xs text-slate mt-0.5">
            Tvůj současný příjem: <strong className="text-navy">{fmtCzk(monthlyIncomeNet)}</strong> / měs · Vespod sloupce vidíš svůj zůstatek, navrch ti pojistka dorovnává.
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="rounded-card border border-line bg-surface p-4 md:p-6">
        <ResponsiveContainer width="100%" height={340}>
          <BarChart
            data={chartData}
            margin={{ top: 30, right: 20, bottom: 10, left: 20 }}
            barCategoryGap="22%"
          >
            <XAxis
              dataKey="scenario"
              stroke={BARVY.navy}
              fontSize={13}
              tickLine={false}
              axisLine={{ stroke: BARVY.line }}
            />
            <YAxis
              stroke={BARVY.slate}
              fontSize={11}
              tickFormatter={(v) => `${Math.round(v / 1000)}k`}
              tickLine={false}
              axisLine={{ stroke: BARVY.line }}
            />
            <Tooltip content={<IncomeStackTooltip variants={variants} />} cursor={{ fill: BARVY.cream }} />
            <ReferenceLine
              y={monthlyIncomeNet}
              stroke={BARVY.mintDark}
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: `100 % příjem (${fmtCzk(monthlyIncomeNet)})`,
                position: 'top',
                fill: BARVY.mintDark,
                fontSize: 11,
                fontWeight: 600,
              }}
            />

            {/* Reference sloupec – bez pojistky */}
            <Bar dataKey="zustatek_bez" stackId="bez" fill={BARVY.line} radius={[4, 4, 0, 0]} name="Bez pojistky – zůstatek" />

            {/* Sloupce per varianta – stack: zůstatek (světlejší) + payout (brand barva) */}
            {variants.map((v, idx) => {
              const color = VARIANT_COLORS[idx] ?? BARVY.navy
              const isSelected = selectedVariantId === v.id
              const dim = selectedVariantId && !isSelected ? 0.35 : 1
              return [
                <Bar
                  key={`base-${v.id}`}
                  dataKey={`zustatek_${idx}`}
                  stackId={`v${idx}`}
                  fill={BARVY.line}
                  fillOpacity={dim}
                  name={`${v.company} – tvůj zůstatek`}
                />,
                <Bar
                  key={`payout-${v.id}`}
                  dataKey={`payout_${idx}`}
                  stackId={`v${idx}`}
                  fill={color}
                  fillOpacity={dim}
                  radius={[4, 4, 0, 0]}
                  name={`${v.company} – pojistka dorovná`}
                />,
              ]
            })}

          </BarChart>
        </ResponsiveContainer>

        {/* Custom legenda – méně položek než auto-legenda Recharts */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 text-xs">
          <LegendDot color={BARVY.line} label="Tvůj zůstatek" />
          <LegendDot color={BARVY.line} label="Bez pojistky" muted />
          {variants.map((v, idx) => (
            <LegendDot
              key={v.id}
              color={VARIANT_COLORS[idx] ?? BARVY.navy}
              label={`${v.company} dorovná`}
            />
          ))}
        </div>
      </div>

      {/* Variant cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {variants.map((v, idx) => {
          const color = VARIANT_COLORS[idx] ?? BARVY.navy
          const isSelected = selectedVariantId === v.id
          const payout60 = v.details?.payout_60 ?? 0
          const payout50 = v.details?.payout_50 ?? 0

          return (
            <button
              key={v.id}
              type="button"
              onClick={() => onSelect(v.id)}
              className={`text-left rounded-card p-4 border-2 transition-all hover:-translate-y-0.5 ${
                isSelected
                  ? 'bg-mint/8 border-mint shadow-[0_8px_24px_-12px_rgba(31,181,143,0.4)]'
                  : 'bg-surface border-line hover:border-mint/40 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-card flex items-center justify-center text-white font-bold flex-shrink-0 shadow-sm"
                  style={{ background: color }}
                >
                  {v.logo}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={`font-semibold ${isSelected ? 'text-navy' : 'text-navy'}`}>
                    {v.company}
                  </h4>
                  <p className="text-[11px] uppercase tracking-[0.1em] text-slate">Varianta {idx + 1}</p>
                </div>
                {isSelected && <CheckCircle2 className="w-5 h-5 text-navy shrink-0" />}
              </div>

              <div className="space-y-1.5 text-xs">
                <Row label="Měsíční pojistné" value={v.monthly_payment} />
                <Row label="Výplata 60 %" value={payout60 ? `+${fmtCzk(payout60)}/měs` : '–'} />
                <Row label="Výplata 50 %" value={payout50 ? `+${fmtCzk(payout50)}/měs` : '–'} />
                {v.details?.waiting_period_days != null && (
                  <Row label="Karence" value={`${v.details.waiting_period_days} dní`} muted />
                )}
                {v.details?.max_payout_years != null && (
                  <Row label="Max. délka" value={`${v.details.max_payout_years} let`} muted />
                )}
              </div>

              <div
                className={`mt-4 text-center text-xs font-semibold py-2 rounded-card ${
                  isSelected
                    ? 'bg-mint text-navy'
                    : 'bg-navy/5 text-navy'
                }`}
              >
                {isSelected ? '✓ Vybráno' : 'Vybrat tuto variantu'}
              </div>
            </button>
          )
        })}
      </div>

      {/* Vybraná varianta – sumář */}
      {selected && (
        <div className="rounded-card bg-mint/8 border border-mint/25 p-4 md:p-5">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-navy mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-navy">
                Vybraná varianta: {selected.company}
              </p>
              <p className="text-xs text-navy/80 mt-1 leading-relaxed">
                Při výpadku příjmu na 60 % ti pojistka pošle <strong>{fmtCzk(selected.details?.payout_60 ?? 0)}</strong> měsíčně,
                při 50 % až <strong>{fmtCzk(selected.details?.payout_50 ?? 0)}</strong> měsíčně.
                Měsíční pojistné: <strong>{selected.monthly_payment}</strong>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Časová osa "Co se ti může v životě stát" */}
      <LifeRiskTimeline variants={variants} selectedVariantId={selectedVariantId} />

      {/* Pojistné krytí – co která komponenta dělá */}
      <CoveragePanel
        selected={selected ?? null}
        variants={variants}
      />
    </div>
  )
}

function CoveragePanel({
  selected,
  variants,
}: {
  selected: IncomeVariant | null
  variants: IncomeVariant[]
}) {
  // Pokud klient nevybral, použij první variantu pro náhled (s indikací).
  const display = selected ?? variants[0] ?? null
  if (!display) return null

  const hasAny = RISK_DEFS.some((r) => {
    const v = display.details?.[r.key]
    return typeof v === 'number' && v > 0
  })
  if (!hasAny) return null

  return (
    <div className="rounded-card border border-line bg-surface p-4 md:p-6">
      <div className="flex items-start justify-between mb-5 gap-3">
        <div>
          <h3 className="text-navy font-display text-base font-semibold">Co tě pojistka chrání</h3>
          <p className="text-xs text-slate mt-0.5">
            {selected
              ? <>Krytí ve vybrané variantě <strong className="text-navy">{display.company}</strong>.</>
              : <>Náhled krytí varianty <strong className="text-navy">{display.company}</strong> – vyber konkrétní variantu výše pro definitivní hodnoty.</>}
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {RISK_GROUPS.map((g) => {
          const items = RISK_DEFS.filter((r) => r.group === g.id)
          const populated = items.filter((r) => {
            const v = display.details?.[r.key]
            return typeof v === 'number' && v > 0
          })
          if (populated.length === 0) return null

          return (
            <div key={g.id}>
              <div className="flex items-baseline justify-between mb-2.5">
                <h4 className="text-xs uppercase tracking-[0.15em] text-slate font-semibold">{g.label}</h4>
                <span className="text-[11px] text-slate/80">{g.subtitle}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {populated.map((r) => (
                  <RiskCard
                    key={r.key}
                    def={r}
                    value={display.details?.[r.key] as number}
                    highlighted={!!selected}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function LegendDot({ color, label, muted }: { color: string; label: string; muted?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${muted ? 'opacity-70' : ''}`}>
      <span className="w-3 h-3 rounded-card" style={{ background: color, border: muted ? `1px solid ${BARVY.line}` : 'none' }} />
      <span className="text-navy">{label}</span>
    </span>
  )
}

function RiskCard({
  def,
  value,
  highlighted,
}: {
  def: RiskDef
  value: number
  highlighted: boolean
}) {
  const Icon = def.icon
  const isDaily = def.unit === 'daily'
  const formatted = isDaily
    ? `${Math.round(value).toLocaleString('cs-CZ')} Kč/den`
    : `${Math.round(value).toLocaleString('cs-CZ')} Kč`
  return (
    <div
      className="rounded-card border p-3.5 transition-all"
      style={{
        background: highlighted ? `${def.color}0d` : BARVY.surface,
        borderColor: highlighted ? `${def.color}55` : BARVY.line,
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-card flex items-center justify-center text-white shrink-0"
          style={{ background: def.color }}
        >
          <Icon className="w-4 h-4" strokeWidth={1.8} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2 mb-0.5">
            <span className="text-[13px] font-semibold text-navy leading-tight">{def.short}</span>
            <span className="text-[13px] font-semibold tabular-nums" style={{ color: def.color }}>{formatted}</span>
          </div>
          <p className="text-[11px] text-slate leading-snug">{def.description}</p>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between gap-2 ${muted ? 'opacity-60' : ''}`}>
      <span className="text-slate">{label}</span>
      <span className="font-semibold text-navy text-right">{value}</span>
    </div>
  )
}

type IncomeTooltipPayloadItem = { name: string; value: number; color: string; dataKey: string }
function IncomeStackTooltip({
  active,
  payload,
  label,
  variants,
}: {
  active?: boolean
  payload?: IncomeTooltipPayloadItem[]
  label?: string
  variants: IncomeVariant[]
}) {
  if (!active || !payload?.length) return null

  // Spáruj dataKey → human label.
  // zustatek_bez → Bez pojistky
  // zustatek_<i> → varianty[i].company – tvůj zůstatek
  // payout_<i>   → varianty[i].company – pojistka pošle
  // Per varianta sečteme zůstatek + payout do celkové sumy.
  const groups = new Map<string, { label: string; remainder: number; payout: number; color: string }>()
  for (const p of payload) {
    if (p.dataKey === 'zustatek_bez') {
      groups.set('bez', { label: 'Bez pojistky', remainder: p.value, payout: 0, color: BARVY.slateSoft })
      continue
    }
    const m = /^(zustatek|payout)_(\d+)$/.exec(p.dataKey)
    if (!m) continue
    const idx = Number(m[2])
    const v = variants[idx]
    if (!v) continue
    const id = `v${idx}`
    const existing = groups.get(id) ?? { label: v.company, remainder: 0, payout: 0, color: p.color }
    if (m[1] === 'zustatek') existing.remainder = p.value
    else { existing.payout = p.value; existing.color = p.color }
    groups.set(id, existing)
  }

  return (
    <div className="bg-surface border border-line rounded-card px-3 py-2.5 shadow-sm min-w-[200px]">
      <p className="text-xs font-semibold text-navy mb-2">{label}</p>
      <div className="space-y-2">
        {Array.from(groups.values()).map((g, idx) => {
          const total = g.remainder + g.payout
          return (
            <div key={idx} className="text-xs">
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-card" style={{ background: g.color }} />
                  <span className="font-semibold text-navy">{g.label}</span>
                </span>
                <span className="font-semibold text-navy">{fmtCzk(total)}</span>
              </div>
              {g.payout > 0 && (
                <div className="pl-3.5 mt-0.5 text-[10px] text-slate">
                  zůstatek {fmtCzk(g.remainder)} + pojistka {fmtCzk(g.payout)}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
