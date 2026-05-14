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
  const [hoveredPoint, setHoveredPoint] = useState<{ riskKey: RiskKey; variantIdx: number } | null>(null)
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

  // Pro celé množinu variant max — drží konstantní Y-scale, ať klient
  // při přepnutí varianty vidí změnu pozice (a ne přepočítaný graf).
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

  // Layout — když je málo místa, dáme bodům absolutní minimum a SVG se bude scrollovat
  const MIN_GAP_PX = 96
  const padX = 50
  const padTop = 110           // víc místa nahoru — rotované labely se vejdou
  const padBottom = 80
  const computedWidth = Math.max(
    width,
    padX * 2 + Math.max(0, (visibleRisks.length - 1)) * MIN_GAP_PX,
  )
  const innerWidth = Math.max(computedWidth - padX * 2, 200)
  const innerHeight = 200
  const totalHeight = innerHeight + padTop + padBottom

  const xFor = (idx: number) =>
    visibleRisks.length === 1 ? padX + innerWidth / 2 : padX + (idx / (visibleRisks.length - 1)) * innerWidth

  const yFor = (amount: number) => {
    if (maxAmount === 0) return padTop + innerHeight - 20
    // log-ish scale aby denní dávky byly viditelné vedle lump (řád 100k–2M)
    const log = Math.log10(Math.max(amount, 1))
    const logMax = Math.log10(Math.max(maxAmount, 10))
    const t = log / logMax
    return padTop + innerHeight - t * (innerHeight - 30)
  }

  // Pro každou variantu její vlastní křivka skrz body
  const variantSeries = variants.map((v, vIdx) => {
    const color = VARIANT_COLORS[vIdx] ?? '#162459'
    const pts = visibleRisks.map((r, rIdx) => {
      const amount = calcAmount(v, r)
      return { x: xFor(rIdx), y: yFor(amount), risk: r, amount }
    })
    return { variant: v, variantIdx: vIdx, color, pts }
  })

  // Vybraná varianta pro detail (může být null pokud klient ještě nevybral)
  const selected = selectedVariantId ? variants.find((v) => v.id === selectedVariantId) ?? null : null
  const selectedIdx = selected ? variants.indexOf(selected) : -1

  return (
    <div className="rounded-3xl border border-[#E8E9EE] bg-white p-4 md:p-6">
      <div className="flex flex-wrap items-baseline justify-between mb-4 gap-3">
        <div>
          <h3 className="text-[#162459] font-display text-base font-semibold">Co se ti může v životě stát</h3>
          <p className="text-xs text-[#818EAF] mt-0.5">
            {selected ? (
              <>Zvýrazněná je <strong className="text-[#162459]">{selected.company}</strong>. Ostatní jsou ztlumené pro porovnání.</>
            ) : (
              <>Všechny varianty paralelně — vyber jednu výše a zvýrazní se.</>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {variants.map((v, idx) => {
            const color = VARIANT_COLORS[idx] ?? '#162459'
            const dim = selectedIdx >= 0 && selectedIdx !== idx
            return (
              <span key={v.id} className={`inline-flex items-center gap-1.5 ${dim ? 'opacity-50' : ''}`}>
                <span className="w-3 h-3 rounded-full" style={{ background: color }} />
                <span className="text-[#162459]">{v.company}</span>
              </span>
            )
          })}
        </div>
      </div>

      <div ref={containerRef} className="relative" style={{ minHeight: totalHeight }}>
        <div className="overflow-x-auto -mx-2 px-2">
        <svg
          width={computedWidth}
          height={totalHeight}
          viewBox={`0 0 ${computedWidth} ${totalHeight}`}
          style={{ minWidth: computedWidth }}
        >
          {/* Šedý referenční podklad pod křivkami */}
          <line
            x1={padX}
            x2={computedWidth - padX}
            y1={padTop + innerHeight}
            y2={padTop + innerHeight}
            stroke="#E8E9EE"
            strokeWidth={1}
          />

          {/* Per varianta: vlastní křivka */}
          {variantSeries.map(({ variantIdx, color, pts }) => {
            const dim = selectedIdx >= 0 && selectedIdx !== variantIdx
            return (
              <path
                key={`path-${variantIdx}`}
                d={smoothPath(pts.map((p) => [p.x, p.y]))}
                fill="none"
                stroke={color}
                strokeWidth={selectedIdx === variantIdx ? 3 : 2}
                strokeLinecap="round"
                opacity={dim ? 0.3 : 0.85}
                style={{ transition: 'opacity 0.3s ease, stroke-width 0.3s ease' }}
              />
            )
          })}

          {/* Per riziko: labely a invisible click area */}
          {visibleRisks.map((risk, rIdx) => {
            const x = xFor(rIdx)
            const isExpanded = expanded === risk.key
            const isHovered = hoveredKey === risk.key
            return (
              <g key={`label-${risk.key}`}>
                {/* invisible click/hover area — celá svislá zóna */}
                <rect
                  x={x - 40}
                  y={padTop - 30}
                  width={80}
                  height={innerHeight + 40}
                  fill="transparent"
                  onMouseEnter={() => setHoveredKey(risk.key)}
                  onMouseLeave={() => setHoveredKey(null)}
                  onClick={() => setExpanded((prev) => (prev === risk.key ? null : risk.key))}
                  style={{ cursor: 'pointer' }}
                />

                {/* svislá zvýrazňující linka při hover/expand */}
                {(isHovered || isExpanded) && (
                  <line
                    x1={x}
                    x2={x}
                    y1={padTop - 10}
                    y2={padTop + innerHeight + 6}
                    stroke={risk.color}
                    strokeWidth={1}
                    strokeDasharray="3 3"
                    opacity={0.4}
                  />
                )}

                {/* label nad osou — rotovaný */}
                <g transform={`translate(${x},${padTop - 10})`} style={{ pointerEvents: 'none' }}>
                  <text
                    textAnchor="start"
                    fontSize={11}
                    fontWeight={isExpanded ? 700 : 600}
                    fill={isExpanded || isHovered ? risk.color : '#162459'}
                    transform="rotate(-32) translate(6 0)"
                  >
                    {risk.short}
                  </text>
                </g>
              </g>
            )
          })}

          {/* Per varianta: její body */}
          {variantSeries.map(({ variantIdx, color, pts, variant }) => {
            const dim = selectedIdx >= 0 && selectedIdx !== variantIdx
            const variantOpacity = dim ? 0.35 : 1
            return (
              <g key={`points-${variantIdx}`} opacity={variantOpacity} style={{ transition: 'opacity 0.3s ease' }}>
                {pts.map(({ x, y, risk, amount }) => {
                  const isPointHover =
                    hoveredPoint?.riskKey === risk.key && hoveredPoint.variantIdx === variantIdx
                  const isSelectedVariant = selectedIdx === variantIdx
                  const r = isPointHover ? 8 : isSelectedVariant ? 6 : 5
                  return (
                    <g
                      key={`pt-${variantIdx}-${risk.key}`}
                      transform={`translate(${x},${y})`}
                      onMouseEnter={() => setHoveredPoint({ riskKey: risk.key, variantIdx })}
                      onMouseLeave={() => setHoveredPoint(null)}
                      style={{ cursor: 'pointer', transition: 'transform 0.45s ease' }}
                    >
                      {isPointHover && (
                        <circle r={14} fill={color} opacity={0.2} />
                      )}
                      <circle r={r} fill={color} stroke="#fff" strokeWidth={1.5} />

                      {/* Tooltip jen pro hover bod */}
                      {isPointHover && (
                        <foreignObject
                          x={-115}
                          y={-78}
                          width={230}
                          height={66}
                          style={{ pointerEvents: 'none' }}
                        >
                          <div className="bg-white border border-[#E8E9EE] rounded-xl shadow-md px-3 py-2 text-[11px] leading-snug">
                            <div className="font-semibold text-[#162459] mb-0.5">
                              {variant.company}
                            </div>
                            <div className="text-[#818EAF] mb-0.5">{risk.short}</div>
                            <div className="font-semibold" style={{ color }}>
                              {amount > 0
                                ? compactCzk(amount) + (risk.unit === 'daily' ? ' / měs' : ' jednorázově')
                                : 'Bez krytí'}
                            </div>
                          </div>
                        </foreignObject>
                      )}
                    </g>
                  )
                })}
              </g>
            )
          })}

          {/* Spodní markery — méně závažné / nejzávažnější */}
          <text
            x={padX}
            y={totalHeight - 18}
            textAnchor="start"
            fontSize={10}
            fill="#15803d"
            fontWeight={600}
          >
            ← Méně závažné
          </text>
          <text
            x={computedWidth - padX}
            y={totalHeight - 18}
            textAnchor="end"
            fontSize={10}
            fill="#b91c1c"
            fontWeight={600}
          >
            Nejzávažnější →
          </text>
        </svg>
        </div>
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
