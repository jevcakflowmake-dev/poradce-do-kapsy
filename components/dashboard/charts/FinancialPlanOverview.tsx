'use client'

import { useMemo } from 'react'
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts'

// ── Typy ─────────────────────────────────────────────────
interface Variant {
  company: string
  monthlyPayment: string
}
export interface PlanSectionLite {
  id: string
  title: string
  type: 'variants' | 'simple'
  variants?: Variant[]
  status: 'ok' | 'recommendation' | 'action'
}

interface Props {
  sections: PlanSectionLite[]
}

// ── Konfigurace ──────────────────────────────────────────
const SECTION_COLOR: Record<string, string> = {
  income: '#162459',
  housing: '#009EE2',
  retirement: '#243471',
  children: '#0088c6',
  investing: '#1a2d6e',
  property: '#5cb8ec',
}

const STATUS_COLOR = {
  ok: '#16a34a',
  recommendation: '#009EE2',
  action: '#f59e0b',
} as const

const STATUS_LABEL = {
  ok: 'V pořádku',
  recommendation: 'Doporučení',
  action: 'Vyžaduje akci',
} as const

// score 0–100 pro radar
const STATUS_SCORE = {
  ok: 100,
  recommendation: 60,
  action: 25,
} as const

// ── Helpers ──────────────────────────────────────────────
function parsePayment(s: string | undefined): number {
  if (!s) return 0
  const cleaned = s.replace(/ /g, ' ').replace(/\s+/g, '')
  const match = cleaned.match(/(\d+(?:[.,]\d+)?)/)
  if (!match) return 0
  return parseFloat(match[1].replace(',', '.'))
}

function fmtCzk(n: number): string {
  return n.toLocaleString('cs-CZ', { maximumFractionDigits: 0 }) + ' Kč'
}

// ── Komponenta ───────────────────────────────────────────
export default function FinancialPlanOverview({ sections }: Props) {
  // Radar data — skóre pokrytí podle statusu
  const radarData = useMemo(
    () =>
      sections.map((s) => ({
        section: s.title,
        score: STATUS_SCORE[s.status],
        fullMark: 100,
      })),
    [sections],
  )

  // Donut — měsíční náklady (suma variant per sekce, bere min variantu jako "indikativní")
  const monthlyData = useMemo(() => {
    const data = sections
      .filter((s) => s.type === 'variants' && s.variants && s.variants.length > 0)
      .map((s) => {
        const prices = (s.variants ?? []).map((v) => parsePayment(v.monthlyPayment)).filter((p) => p > 0)
        // bere medián jako indikativní cenu (méně citlivé na outliers)
        const sorted = [...prices].sort((a, b) => a - b)
        const indicative = sorted[Math.floor(sorted.length / 2)] ?? 0
        return {
          section: s.title,
          value: indicative,
          fill: SECTION_COLOR[s.id] ?? '#162459',
        }
      })
      .filter((d) => d.value > 0)
    return data
  }, [sections])

  const totalMonthly = monthlyData.reduce((sum, d) => sum + d.value, 0)

  // Status counts
  const statusCounts = useMemo(() => {
    const counts = { ok: 0, recommendation: 0, action: 0 }
    sections.forEach((s) => counts[s.status]++)
    return counts
  }, [sections])

  // Variant compare — per section, kolik variant a jaké ceny
  const variantsBarData = useMemo(() => {
    return sections
      .filter((s) => s.type === 'variants' && s.variants && s.variants.length > 0)
      .map((s) => {
        const prices = (s.variants ?? []).map((v) => parsePayment(v.monthlyPayment)).filter((p) => p > 0)
        if (prices.length === 0) return null
        const min = Math.min(...prices)
        const max = Math.max(...prices)
        const avg = prices.reduce((a, b) => a + b, 0) / prices.length
        return {
          section: s.title,
          sectionId: s.id,
          min,
          max,
          avg: Math.round(avg),
          count: prices.length,
          fill: SECTION_COLOR[s.id] ?? '#162459',
        }
      })
      .filter((d): d is NonNullable<typeof d> => d !== null)
  }, [sections])

  if (sections.length === 0) return null

  return (
    <div className="space-y-6 mb-8">
      {/* ── Status sumarizace ───────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        <StatusCard count={statusCounts.ok} status="ok" />
        <StatusCard count={statusCounts.recommendation} status="recommendation" />
        <StatusCard count={statusCounts.action} status="action" />
      </div>

      {/* ── Radar + Donut grid ─────────────────────────── */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Radar — Pokrytí oblastí */}
        <ChartCard
          className="lg:col-span-3"
          title="Pokrytí finančních oblastí"
          subtitle="Profil zajištění napříč 6 sekcemi plánu"
        >
          <ResponsiveContainer width="100%" height={320}>
            <RadarChart data={radarData} margin={{ top: 20, right: 30, bottom: 10, left: 30 }}>
              <PolarGrid stroke="#E8E9EE" />
              <PolarAngleAxis
                dataKey="section"
                tick={{ fill: '#162459', fontSize: 12, fontWeight: 500 }}
              />
              <Radar
                name="Stav pokrytí"
                dataKey="score"
                stroke="#009EE2"
                strokeWidth={2}
                fill="#009EE2"
                fillOpacity={0.25}
              />
              <Tooltip content={<RadarTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Donut — Měsíční náklady */}
        <ChartCard
          className="lg:col-span-2"
          title="Indikativní měsíční náklady"
          subtitle={`Celkem ${fmtCzk(totalMonthly)} / měs`}
        >
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={monthlyData}
                  dataKey="value"
                  nameKey="section"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  stroke="#fff"
                  strokeWidth={2}
                >
                  {monthlyData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<DonutTooltip total={totalMonthly} />} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  formatter={(value) => <span className="text-xs text-[#162459]">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="Zatím žádné varianty s nastavenou cenou." />
          )}
        </ChartCard>
      </div>

      {/* ── Srovnání cen variant per sekce ──────────────── */}
      {variantsBarData.length > 0 && (
        <ChartCard
          title="Srovnání variant po sekcích"
          subtitle="Rozpětí měsíční ceny napříč nabídnutými variantami"
        >
          <ResponsiveContainer width="100%" height={Math.max(220, variantsBarData.length * 50)}>
            <BarChart
              data={variantsBarData}
              layout="vertical"
              margin={{ top: 10, right: 30, bottom: 10, left: 30 }}
            >
              <XAxis
                type="number"
                tickFormatter={(v) => v + ' Kč'}
                stroke="#818EAF"
                fontSize={11}
              />
              <YAxis
                type="category"
                dataKey="section"
                stroke="#162459"
                fontSize={12}
                width={140}
              />
              <Tooltip content={<VariantBarTooltip />} />
              <Bar dataKey="min" stackId="range" name="Od" fill="#cfeaf8" />
              <Bar dataKey="avg" stackId="range" name="Průměr" fill="#009EE2" />
              <Legend
                verticalAlign="top"
                iconType="square"
                wrapperStyle={{ fontSize: 12 }}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>
  )
}

// ── Sub-komponenty ───────────────────────────────────────
function StatusCard({
  count,
  status,
}: {
  count: number
  status: keyof typeof STATUS_COLOR
}) {
  const color = STATUS_COLOR[status]
  const label = STATUS_LABEL[status]
  return (
    <div
      className="rounded-2xl p-4 border bg-white"
      style={{ borderColor: color + '33' }}
    >
      <div className="flex items-baseline gap-2">
        <span
          className="font-display text-3xl font-semibold"
          style={{ color }}
        >
          {count}
        </span>
        <span className="text-sm text-[#162459]/80">{label}</span>
      </div>
      <div
        className="h-1 rounded-full mt-3"
        style={{ background: color + '22' }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.min(100, count * 20)}%`,
            background: color,
          }}
        />
      </div>
    </div>
  )
}

function ChartCard({
  title,
  subtitle,
  className,
  children,
}: {
  title: string
  subtitle?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={`bg-white rounded-3xl border border-[#E8E9EE] p-6 ${className ?? ''}`}>
      <div className="mb-4">
        <h3 className="text-[#162459] font-display text-lg font-semibold">{title}</h3>
        {subtitle && (
          <p className="text-xs text-[#818EAF] mt-0.5">{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="h-[320px] flex items-center justify-center text-sm text-[#818EAF]">
      {message}
    </div>
  )
}

// ── Custom Tooltips ──────────────────────────────────────
type RadarPayloadItem = { value: number; payload?: { section: string } }
function RadarTooltip({ active, payload }: { active?: boolean; payload?: RadarPayloadItem[] }) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div className="bg-white border border-[#E8E9EE] rounded-xl px-3 py-2 shadow-sm">
      <p className="text-xs font-semibold text-[#162459]">{item.payload?.section}</p>
      <p className="text-xs text-[#818EAF] mt-0.5">Skóre {item.value}/100</p>
    </div>
  )
}

type DonutPayloadItem = { value: number; name: string; payload: { fill: string } }
function DonutTooltip({
  active,
  payload,
  total,
}: {
  active?: boolean
  payload?: DonutPayloadItem[]
  total: number
}) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  const pct = total > 0 ? (item.value / total) * 100 : 0
  return (
    <div className="bg-white border border-[#E8E9EE] rounded-xl px-3 py-2 shadow-sm">
      <div className="flex items-center gap-2">
        <span
          className="inline-block w-2.5 h-2.5 rounded-full"
          style={{ background: item.payload.fill }}
        />
        <p className="text-xs font-semibold text-[#162459]">{item.name}</p>
      </div>
      <p className="text-xs text-[#818EAF] mt-1">
        {fmtCzk(item.value)} · {pct.toFixed(0)}%
      </p>
    </div>
  )
}

type BarPayloadItem = {
  payload: { section: string; min: number; max: number; avg: number; count: number }
}
function VariantBarTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: BarPayloadItem[]
}) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-white border border-[#E8E9EE] rounded-xl px-3 py-2 shadow-sm">
      <p className="text-xs font-semibold text-[#162459]">{d.section}</p>
      <p className="text-xs text-[#818EAF] mt-1">
        {d.count}× variant · {fmtCzk(d.min)} – {fmtCzk(d.max)}
      </p>
      <p className="text-xs text-[#162459] mt-0.5">
        Průměr {fmtCzk(d.avg)}
      </p>
    </div>
  )
}
