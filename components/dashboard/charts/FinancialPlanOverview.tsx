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
  Tooltip,
  Legend,
} from 'recharts'
import { BARVY } from '@/lib/barvy'

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
  income: BARVY.navy,
  housing: BARVY.mint,
  retirement: BARVY.navySoft,
  children: BARVY.mintDark,
  investing: BARVY.navySoft,
  property: BARVY.mint,
}

const STATUS_COLOR = {
  ok: BARVY.mint,
  recommendation: BARVY.mint,
  action: BARVY.amber,
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

/**
 * Sekce, jejichž měsíční částka je cena produktu, který klient začne platit,
 * takže se smí sečíst do jednoho čísla.
 *
 * Bydlení mezi ně schválně nepatří: splátku hypotéky klient platí i dnes,
 * plán ji mění, ne přidává. Sečteno s pojistným vzniklo číslo, které
 * neodpovídá ani tomu, co platí teď, ani tomu, co by platil navíc —
 * u testovacích dat dělala samotná hypotéka 80 % „nákladů plánu".
 */
/**
 * Popisky os radaru. Plné názvy sekcí se do grafu nevejdou — „Pojištění
 * majetku" se ořízlo na „ění majetku". Plný název zůstává v tooltipu.
 */
const KRATKY_NAZEV: Record<string, string> = {
  income: 'Příjem',
  housing: 'Bydlení',
  retirement: 'Důchod',
  children: 'Děti',
  investing: 'Investice',
  property: 'Majetek',
}

const PRODUKTOVE_SEKCE = new Set(['income', 'retirement', 'children', 'investing', 'property'])

/**
 * Nejlevnější varianta v sekci. Dřív se tu bral `sorted[floor(n/2)]` jako
 * medián – jenže u dvou variant, což je nejběžnější případ, to vybere tu
 * dražší. Klient tak viděl vyšší částku, než jakou by po výběru zaplatil.
 */
function nejlevnejsi(s: PlanSectionLite): number {
  const ceny = (s.variants ?? []).map((v) => parsePayment(v.monthlyPayment)).filter((p) => p > 0)
  return ceny.length > 0 ? Math.min(...ceny) : 0
}

function fmtCzk(n: number): string {
  return n.toLocaleString('cs-CZ', { maximumFractionDigits: 0 }) + ' Kč'
}

// ── Komponenta ───────────────────────────────────────────
export default function FinancialPlanOverview({ sections }: Props) {
  // Radar data – skóre pokrytí podle statusu
  const radarData = useMemo(
    () =>
      sections.map((s) => ({
        section: KRATKY_NAZEV[s.id] ?? s.title,
        nazev: s.title,
        score: STATUS_SCORE[s.status],
        fullMark: 100,
      })),
    [sections],
  )

  // Donut – měsíční platby za produkty, které klient začne platit.
  const monthlyData = useMemo(
    () =>
      sections
        .filter((s) => PRODUKTOVE_SEKCE.has(s.id))
        .map((s) => ({
          section: s.title,
          value: nejlevnejsi(s),
          fill: SECTION_COLOR[s.id] ?? BARVY.navy,
        }))
        .filter((d) => d.value > 0),
    [sections],
  )

  const totalMonthly = monthlyData.reduce((sum, d) => sum + d.value, 0)

  // Hypotéka stojí stranou součtu – viz PRODUKTOVE_SEKCE.
  const splatkaBydleni = useMemo(() => {
    const housing = sections.find((s) => s.id === 'housing')
    return housing ? nejlevnejsi(housing) : 0
  }, [sections])

  // Status counts
  const statusCounts = useMemo(() => {
    const counts = { ok: 0, recommendation: 0, action: 0 }
    sections.forEach((s) => counts[s.status]++)
    return counts
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
        {/* Radar – Pokrytí oblastí */}
        <ChartCard
          className="lg:col-span-3"
          title="Pokrytí finančních oblastí"
          subtitle={`Profil zajištění ${sections.length === 1 ? "v jediné oblasti" : `napříč ${sections.length} oblastmi`} plánu`}
        >
          <ResponsiveContainer width="100%" height={320}>
            <RadarChart data={radarData} margin={{ top: 20, right: 30, bottom: 10, left: 30 }}>
              <PolarGrid stroke={BARVY.line} />
              <PolarAngleAxis
                dataKey="section"
                tick={{ fill: BARVY.navy, fontSize: 12, fontWeight: 500 }}
              />
              <Radar
                name="Stav pokrytí"
                dataKey="score"
                stroke={BARVY.mint}
                strokeWidth={2}
                fill={BARVY.mint}
                fillOpacity={0.25}
              />
              <Tooltip content={<RadarTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Donut – Měsíční náklady */}
        <ChartCard
          className="lg:col-span-2"
          title="Měsíční platby podle plánu"
          subtitle={
            totalMonthly > 0
              ? `Od ${fmtCzk(totalMonthly)} / měs. podle nejlevnější varianty`
              : 'Zatím bez nastavených cen'
          }
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
                  formatter={(value) => <span className="text-xs text-navy">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="Zatím žádné varianty s nastavenou cenou." />
          )}

          {splatkaBydleni > 0 && (
            <p className="text-base text-slate mt-3 text-pretty">
              Splátka hypotéky {fmtCzk(splatkaBydleni)} / měs. stojí mimo tenhle součet – platíte ji i dnes,
              plán ji mění, nepřidává.
            </p>
          )}
        </ChartCard>
      </div>

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
      className="rounded-card p-4 border bg-surface"
      style={{ borderColor: color + '33' }}
    >
      {/* Na úzkém displeji pod sebe: „Vyžaduje akci" vedle čísla přetékalo z karty. */}
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
        <span
          className="font-display text-3xl font-semibold leading-none"
          style={{ color }}
        >
          {count}
        </span>
        <span className="text-sm text-navy/80 text-pretty">{label}</span>
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
    <div className={`bg-surface rounded-card border border-line p-6 ${className ?? ''}`}>
      <div className="mb-4">
        <h3 className="text-navy font-display text-lg font-semibold">{title}</h3>
        {subtitle && (
          <p className="text-xs text-slate mt-0.5">{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="h-[320px] flex items-center justify-center text-sm text-slate">
      {message}
    </div>
  )
}

// ── Custom Tooltips ──────────────────────────────────────
type RadarPayloadItem = { value: number; payload?: { section: string; nazev?: string } }
function RadarTooltip({ active, payload }: { active?: boolean; payload?: RadarPayloadItem[] }) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div className="bg-surface border border-line rounded-card px-3 py-2 shadow-sm">
      <p className="text-xs font-semibold text-navy">{item.payload?.nazev ?? item.payload?.section}</p>
      <p className="text-xs text-slate mt-0.5">Skóre {item.value}/100</p>
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
    <div className="bg-surface border border-line rounded-card px-3 py-2 shadow-sm">
      <div className="flex items-center gap-2">
        <span
          className="inline-block w-2.5 h-2.5 rounded-full"
          style={{ background: item.payload.fill }}
        />
        <p className="text-xs font-semibold text-navy">{item.name}</p>
      </div>
      <p className="text-xs text-slate mt-1">
        {fmtCzk(item.value)} · {pct.toFixed(0)} %
      </p>
    </div>
  )
}

