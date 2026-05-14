'use client'

import { useState, useMemo, useRef, useLayoutEffect } from 'react'
import { RISK_DEFS, type RiskKey, type RiskDef } from '@/lib/income-risks'
import type { IncomeVariant } from './IncomeLifeChart'

interface Props {
  variants: IncomeVariant[]
  selectedVariantId: string | null
}

const VARIANT_COLORS = ['#009EE2', '#162459', '#0088c6']
const DEFAULT_WAITING_PERIOD_DAYS = 14
const DAYS_IN_MONTH = 30

/**
 * Spočítá co klient dostane od dané varianty pro dané riziko.
 * Pro denní dávky: vrací měsíční ekvivalent (Kč/měs). Pro lump: Kč jednorázově.
 */
function calcAmount(v: IncomeVariant, risk: RiskDef): number {
  const raw = (v.details as Record<string, unknown> | null)?.[risk.key]
  if (typeof raw !== 'number') return 0
  if (risk.unit === 'lump') return raw
  // daily — převedeme na měsíční ekvivalent
  if (risk.key === 'daily_sick_leave') {
    const karence = (v.details?.waiting_period_days ?? DEFAULT_WAITING_PERIOD_DAYS) as number
    return raw * Math.max(0, DAYS_IN_MONTH - karence)
  }
  return raw * DAYS_IN_MONTH
}

function fmtCzk(n: number, unit: 'monthly' | 'lump'): string {
  if (n === 0) return '—'
  const rounded = Math.round(n).toLocaleString('cs-CZ')
  return unit === 'monthly' ? `${rounded} Kč/měs` : `${rounded} Kč`
}

/**
 * Řadíme rizika podél osy "od méně závažných po nejzávažnější".
 * Stejný řád jak `RISK_DEFS` (denní → jednorázové → invalidita → smrt).
 */
const ORDERED_RISKS = RISK_DEFS

export default function LifeRiskTimeline({ variants, selectedVariantId }: Props) {
  const [hoveredKey, setHoveredKey] = useState<RiskKey | null>(null)
  const [expanded, setExpanded] = useState<RiskKey | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [width, setWidth] = useState(900)

  useLayoutEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect?.width ?? 900
      setWidth(w)
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  // Pro každé riziko: max částka přes všechny varianty — určuje výšku bodu (Y) na timeline
  const maxAmount = useMemo(() => {
    let m = 0
    for (const v of variants) {
      for (const r of ORDERED_RISKS) {
        const a = calcAmount(v, r)
        if (a > m) m = a
      }
    }
    return m
  }, [variants])

  if (variants.length === 0) return null

  // Filtruj rizika která mají alespoň jednu nenulovou hodnotu napříč variantami
  const visibleRisks = ORDERED_RISKS.filter((r) =>
    variants.some((v) => calcAmount(v, r) > 0),
  )
  if (visibleRisks.length === 0) return null

  // Layout
  const padX = 50
  const padY = 60
  const innerWidth = Math.max(width - padX * 2, 200)
  const innerHeight = 220
  const totalHeight = innerHeight + padY * 2

  const xFor = (idx: number) =>
    visibleRisks.length === 1 ? padX + innerWidth / 2 : padX + (idx / (visibleRisks.length - 1)) * innerWidth

  const yFor = (amount: number) => {
    if (maxAmount === 0) return padY + innerHeight - 20
    // log-ish scale aby denní dávky byly viditelné vedle lump (řád 100k–2M)
    const log = Math.log10(Math.max(amount, 1))
    const logMax = Math.log10(Math.max(maxAmount, 10))
    const t = log / logMax
    return padY + innerHeight - t * (innerHeight - 30)
  }

  // Path mezi body
  const points = visibleRisks.map((r, idx) => {
    const maxForRisk = Math.max(...variants.map((v) => calcAmount(v, r)))
    return { x: xFor(idx), y: yFor(maxForRisk), risk: r, max: maxForRisk }
  })

  // Vybraná varianta pro detail
  const selected = variants.find((v) => v.id === selectedVariantId) ?? null

  return (
    <div className="rounded-3xl border border-[#E8E9EE] bg-white p-4 md:p-6">
      <div className="flex flex-wrap items-baseline justify-between mb-4 gap-2">
        <div>
          <h3 className="text-[#162459] font-display text-base font-semibold">Co se ti může v životě stát</h3>
          <p className="text-xs text-[#818EAF] mt-0.5">
            Od běžného úrazu po nejvážnější dopady. Najeď myší na bod, nebo na něj klikni pro detail{selected ? ` (vybráno: ${selected.company})` : ''}.
          </p>
        </div>
      </div>

      <div ref={containerRef} className="relative" style={{ minHeight: totalHeight }}>
        <svg width="100%" height={totalHeight} viewBox={`0 0 ${width} ${totalHeight}`} className="overflow-visible">
          {/* Plynulá křivka skrz body */}
          <path
            d={smoothPath(points.map((p) => [p.x, p.y]))}
            fill="none"
            stroke="#E8E9EE"
            strokeWidth={2}
            strokeLinecap="round"
          />
          <path
            d={smoothPath(points.map((p) => [p.x, p.y]))}
            fill="none"
            stroke="url(#timeline-grad)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeDasharray="4 6"
            opacity={0.6}
          />
          <defs>
            <linearGradient id="timeline-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#009EE2" />
              <stop offset="100%" stopColor="#162459" />
            </linearGradient>
          </defs>

          {/* Body */}
          {points.map(({ x, y, risk, max }, idx) => {
            const isHover = hoveredKey === risk.key
            const isExpanded = expanded === risk.key
            const r = isHover || isExpanded ? 11 : 8
            return (
              <g
                key={risk.key}
                transform={`translate(${x},${y})`}
                onMouseEnter={() => setHoveredKey(risk.key)}
                onMouseLeave={() => setHoveredKey(null)}
                onClick={() => setExpanded((prev) => (prev === risk.key ? null : risk.key))}
                style={{ cursor: 'pointer' }}
              >
                {/* halo */}
                <circle
                  r={isExpanded ? 18 : isHover ? 16 : 0}
                  fill={risk.color}
                  opacity={0.18}
                />
                <circle r={r} fill={risk.color} stroke="#fff" strokeWidth={2} />

                {/* label nad bodem */}
                <text
                  textAnchor="middle"
                  y={-22}
                  fontSize={11}
                  fontWeight={600}
                  fill="#162459"
                  style={{ pointerEvents: 'none' }}
                >
                  {risk.short}
                </text>

                {/* částka pod bodem */}
                <text
                  textAnchor="middle"
                  y={26}
                  fontSize={11}
                  fill={risk.color}
                  fontWeight={600}
                  style={{ pointerEvents: 'none' }}
                >
                  {compactCzk(max)}
                </text>
                <text
                  textAnchor="middle"
                  y={40}
                  fontSize={9}
                  fill="#818EAF"
                  style={{ pointerEvents: 'none' }}
                >
                  {risk.unit === 'daily' ? '/měs' : 'jednorázově'}
                </text>

                {/* Tooltip on hover */}
                {isHover && !isExpanded && (
                  <foreignObject
                    x={-110}
                    y={-90}
                    width={220}
                    height={64}
                    style={{ pointerEvents: 'none' }}
                  >
                    <div className="bg-white border border-[#E8E9EE] rounded-xl shadow-md px-3 py-2 text-[11px] leading-snug text-[#162459]">
                      <div className="font-semibold mb-0.5">{risk.label}</div>
                      <div className="text-[#818EAF]">{risk.description}</div>
                    </div>
                  </foreignObject>
                )}

                {idx === 0 && (
                  <text
                    textAnchor="start"
                    x={-padX + 8}
                    y={innerHeight + padY - y + 12}
                    fontSize={10}
                    fill="#15803d"
                    fontWeight={600}
                  >
                    Méně závažné
                  </text>
                )}
                {idx === points.length - 1 && (
                  <text
                    textAnchor="end"
                    x={width - x - padX + (padX - 8)}
                    y={innerHeight + padY - y + 12}
                    fontSize={10}
                    fill="#b91c1c"
                    fontWeight={600}
                  >
                    Nejzávažnější
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      </div>

      {/* Expanded detail */}
      {expanded && (() => {
        const r = ORDERED_RISKS.find((x) => x.key === expanded)
        if (!r) return null
        const Icon = r.icon
        return (
          <div className="mt-3 rounded-2xl border-2 p-4 md:p-5 transition-all" style={{ borderColor: `${r.color}40`, background: `${r.color}08` }}>
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0" style={{ background: r.color }}>
                <Icon className="w-5 h-5" strokeWidth={1.8} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[#162459] font-semibold">{r.label}</h4>
                <p className="text-xs text-[#818EAF] mt-0.5 leading-relaxed">{r.description}</p>
              </div>
              <button
                type="button"
                onClick={() => setExpanded(null)}
                className="text-[#818EAF] hover:text-[#162459] text-xs font-medium"
              >
                Zavřít
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {variants.map((v, idx) => {
                const a = calcAmount(v, r)
                const color = VARIANT_COLORS[idx] ?? '#162459'
                const isSelected = selectedVariantId === v.id
                return (
                  <div
                    key={v.id}
                    className="rounded-xl p-3 border bg-white flex items-center gap-3"
                    style={{
                      borderColor: isSelected ? '#16a34a' : '#E8E9EE',
                      background: isSelected ? '#16a34a0a' : '#fff',
                    }}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0" style={{ background: color }}>
                      {v.logo || v.company[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-[#818EAF]">{v.company}</div>
                      <div className="text-sm font-semibold text-[#162459]">
                        {fmtCzk(a, r.unit === 'lump' ? 'lump' : 'monthly')}
                      </div>
                    </div>
                    {isSelected && (
                      <span className="text-[10px] uppercase tracking-[0.1em] text-[#15803d] font-semibold">Vybráno</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })()}
    </div>
  )
}

/* ── helpers ──────────────────────────────────────────── */

function smoothPath(pts: Array<[number, number]>): string {
  if (pts.length === 0) return ''
  if (pts.length === 1) return `M ${pts[0][0]} ${pts[0][1]}`
  let d = `M ${pts[0][0]} ${pts[0][1]}`
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1]
    const [x1, y1] = pts[i]
    const cx = (x0 + x1) / 2
    d += ` C ${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`
  }
  return d
}

function compactCzk(n: number): string {
  if (n === 0) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)} mil`
  if (n >= 1_000) return `${Math.round(n / 1_000)} tis`
  return `${Math.round(n)} Kč`
}
