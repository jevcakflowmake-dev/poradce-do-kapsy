'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell,
} from 'recharts'
import { Shield, CheckCircle2 } from 'lucide-react'
import { RISK_DEFS, RISK_GROUPS, type RiskKey, type RiskDef } from '@/lib/income-risks'

type IncomeDetails = {
  payout_60?: number | null
  payout_50?: number | null
  waiting_period_days?: number | null
  max_payout_years?: number | null
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

const VARIANT_COLORS = ['#009EE2', '#162459', '#0088c6']

function fmtCzk(n: number): string {
  return Math.round(n).toLocaleString('cs-CZ') + ' Kč'
}

export default function IncomeLifeChart({
  monthlyIncomeNet,
  variants,
  selectedVariantId,
  onSelect,
}: Props) {
  // hover state pro grouped bar zvýraznění
  const [hovered, setHovered] = useState<string | null>(null)

  if (!monthlyIncomeNet || variants.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-[#E8E9EE] p-8 text-center">
        <p className="text-sm text-[#818EAF]">
          {!monthlyIncomeNet
            ? 'Poradce zatím nenastavil tvůj příjem v plánu.'
            : 'Žádná varianta zatím není k dispozici.'}
        </p>
      </div>
    )
  }

  // Data pro graf — 2 scénáře (60 %, 50 %), pro každý "Bez pojistky" + jednotlivé varianty
  const chartData = useMemo(() => {
    const incomes = [
      { label: 'Pokles na 60 %', factor: 0.6, key: '60' },
      { label: 'Pokles na 50 %', factor: 0.5, key: '50' },
    ]

    return incomes.map(({ label, factor, key }) => {
      const baseIncome = monthlyIncomeNet * factor
      const row: Record<string, string | number> = {
        scenario: label,
        'Bez pojistky': Math.round(baseIncome),
      }
      variants.forEach((v) => {
        const payout = key === '60' ? v.details?.payout_60 ?? 0 : v.details?.payout_50 ?? 0
        row[v.company] = Math.round(baseIncome + (payout ?? 0))
      })
      return row
    })
  }, [monthlyIncomeNet, variants])

  // Selected variant payout summary
  const selected = useMemo(
    () => (selectedVariantId ? variants.find((v) => v.id === selectedVariantId) : null),
    [selectedVariantId, variants],
  )

  return (
    <div className="space-y-5">
      {/* Header s referencí */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div>
          <h3 className="text-[#162459] font-display text-base font-semibold">Co se stane, když ti klesne příjem?</h3>
          <p className="text-xs text-[#818EAF] mt-0.5">
            Tvůj současný příjem: <strong className="text-[#162459]">{fmtCzk(monthlyIncomeNet)}</strong> / měs
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="rounded-3xl border border-[#E8E9EE] bg-white p-4 md:p-6">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={chartData}
            margin={{ top: 30, right: 20, bottom: 10, left: 20 }}
            barCategoryGap="22%"
          >
            <XAxis
              dataKey="scenario"
              stroke="#162459"
              fontSize={13}
              tickLine={false}
              axisLine={{ stroke: '#E8E9EE' }}
            />
            <YAxis
              stroke="#818EAF"
              fontSize={11}
              tickFormatter={(v) => `${Math.round(v / 1000)}k`}
              tickLine={false}
              axisLine={{ stroke: '#E8E9EE' }}
            />
            <Tooltip content={<IncomeTooltip />} cursor={{ fill: '#f8f9fc' }} />
            <ReferenceLine
              y={monthlyIncomeNet}
              stroke="#15803d"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: `100 % příjem (${fmtCzk(monthlyIncomeNet)})`,
                position: 'top',
                fill: '#15803d',
                fontSize: 11,
                fontWeight: 600,
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="square"
              formatter={(value) => <span className="text-xs text-[#162459]">{value}</span>}
              onMouseEnter={(e) => setHovered(e.value as string)}
              onMouseLeave={() => setHovered(null)}
            />
            <Bar dataKey="Bez pojistky" fill="#E8E9EE" radius={[4, 4, 0, 0]}>
              {chartData.map((_, idx) => (
                <Cell
                  key={idx}
                  fill={hovered === 'Bez pojistky' ? '#cbd5e1' : '#E8E9EE'}
                />
              ))}
            </Bar>
            {variants.map((v, idx) => {
              const color = VARIANT_COLORS[idx] ?? '#162459'
              const isSelected = selectedVariantId === v.id
              return (
                <Bar
                  key={v.id}
                  dataKey={v.company}
                  fill={color}
                  radius={[4, 4, 0, 0]}
                  fillOpacity={selectedVariantId && !isSelected ? 0.35 : 1}
                />
              )
            })}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Variant cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {variants.map((v, idx) => {
          const color = VARIANT_COLORS[idx] ?? '#162459'
          const isSelected = selectedVariantId === v.id
          const payout60 = v.details?.payout_60 ?? 0
          const payout50 = v.details?.payout_50 ?? 0

          return (
            <button
              key={v.id}
              type="button"
              onClick={() => onSelect(v.id)}
              className={`text-left rounded-2xl p-4 border-2 transition-all hover:-translate-y-0.5 ${
                isSelected
                  ? 'bg-[#16a34a]/8 border-[#16a34a] shadow-[0_8px_24px_-12px_rgba(22,163,74,0.4)]'
                  : 'bg-white border-[#E8E9EE] hover:border-[#009EE2]/40 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0 shadow-sm"
                  style={{ background: color }}
                >
                  {v.logo}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={`font-semibold ${isSelected ? 'text-[#15803d]' : 'text-[#162459]'}`}>
                    {v.company}
                  </h4>
                  <p className="text-[11px] uppercase tracking-[0.1em] text-[#818EAF]">Varianta {idx + 1}</p>
                </div>
                {isSelected && <CheckCircle2 className="w-5 h-5 text-[#15803d] shrink-0" />}
              </div>

              <div className="space-y-1.5 text-xs">
                <Row label="Měsíční pojistné" value={v.monthly_payment} />
                <Row label="Výplata 60 %" value={payout60 ? `+${fmtCzk(payout60)}/měs` : '—'} />
                <Row label="Výplata 50 %" value={payout50 ? `+${fmtCzk(payout50)}/měs` : '—'} />
                {v.details?.waiting_period_days != null && (
                  <Row label="Karence" value={`${v.details.waiting_period_days} dní`} muted />
                )}
                {v.details?.max_payout_years != null && (
                  <Row label="Max. délka" value={`${v.details.max_payout_years} let`} muted />
                )}
              </div>

              <div
                className={`mt-4 text-center text-xs font-semibold py-2 rounded-lg ${
                  isSelected
                    ? 'bg-[#16a34a] text-white'
                    : 'bg-[#162459]/5 text-[#162459]'
                }`}
              >
                {isSelected ? '✓ Vybráno' : 'Vybrat tuto variantu'}
              </div>
            </button>
          )
        })}
      </div>

      {/* Vybraná varianta — sumář */}
      {selected && (
        <div className="rounded-2xl bg-[#16a34a]/8 border border-[#16a34a]/25 p-4 md:p-5">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-[#15803d] mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#15803d]">
                Vybraná varianta: {selected.company}
              </p>
              <p className="text-xs text-[#162459]/80 mt-1 leading-relaxed">
                Při výpadku příjmu na 60 % ti pojistka pošle <strong>{fmtCzk(selected.details?.payout_60 ?? 0)}</strong> měsíčně,
                při 50 % až <strong>{fmtCzk(selected.details?.payout_50 ?? 0)}</strong> měsíčně.
                Měsíční pojistné: <strong>{selected.monthly_payment}</strong>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Pojistné krytí — co která komponenta dělá */}
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
    <div className="rounded-3xl border border-[#E8E9EE] bg-white p-4 md:p-6">
      <div className="flex items-start justify-between mb-5 gap-3">
        <div>
          <h3 className="text-[#162459] font-display text-base font-semibold">Co tě pojistka chrání</h3>
          <p className="text-xs text-[#818EAF] mt-0.5">
            {selected
              ? <>Krytí ve vybrané variantě <strong className="text-[#162459]">{display.company}</strong>.</>
              : <>Náhled krytí varianty <strong className="text-[#162459]">{display.company}</strong> — vyber konkrétní variantu výše pro definitivní hodnoty.</>}
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
                <h4 className="text-xs uppercase tracking-[0.15em] text-[#818EAF] font-semibold">{g.label}</h4>
                <span className="text-[11px] text-[#818EAF]/80">{g.subtitle}</span>
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
      className="rounded-2xl border p-3.5 transition-all"
      style={{
        background: highlighted ? `${def.color}0d` : '#fcfcfd',
        borderColor: highlighted ? `${def.color}55` : '#E8E9EE',
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0"
          style={{ background: def.color }}
        >
          <Icon className="w-4 h-4" strokeWidth={1.8} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2 mb-0.5">
            <span className="text-[13px] font-semibold text-[#162459] leading-tight">{def.short}</span>
            <span className="text-[13px] font-semibold tabular-nums" style={{ color: def.color }}>{formatted}</span>
          </div>
          <p className="text-[11px] text-[#818EAF] leading-snug">{def.description}</p>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between gap-2 ${muted ? 'opacity-60' : ''}`}>
      <span className="text-[#818EAF]">{label}</span>
      <span className="font-semibold text-[#162459] text-right">{value}</span>
    </div>
  )
}

type IncomeTooltipPayloadItem = { name: string; value: number; color: string; dataKey: string }
function IncomeTooltip({ active, payload, label }: { active?: boolean; payload?: IncomeTooltipPayloadItem[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-[#E8E9EE] rounded-xl px-3 py-2.5 shadow-sm min-w-[180px]">
      <p className="text-xs font-semibold text-[#162459] mb-1.5">{label}</p>
      {payload.map((p, idx) => (
        <div key={idx} className="flex items-center justify-between gap-3 text-xs">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm" style={{ background: p.color }} />
            <span className="text-[#162459]/80">{p.name}</span>
          </span>
          <span className="font-semibold text-[#162459]">{fmtCzk(p.value)}</span>
        </div>
      ))}
    </div>
  )
}
