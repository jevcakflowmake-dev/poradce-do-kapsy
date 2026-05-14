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
  const [pinnedKey, setPinnedKey] = useState<RiskKey | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [width, setWidth] = useState(900)

  const activeKey = pinnedKey ?? hoveredKey

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

  // Layout — vyšší kreslicí plocha, ať info panel vpravo dole nepřekrývá body.
  const MIN_GAP_PX = 72
  const padX = 40
  const padTop = 80            // místo pro rotované labely
  const padBottom = 200        // místo pro info panel (~190px) pod osou
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

          {/* Per riziko: labely a invisible hover/click area */}
          {visibleRisks.map((risk, rIdx) => {
            const x = xFor(rIdx)
            const isActive = activeKey === risk.key
            const isPinned = pinnedKey === risk.key
            return (
              <g key={`label-${risk.key}`}>
                {/* invisible hover/click area — celá svislá zóna */}
                <rect
                  x={x - 40}
                  y={padTop - 30}
                  width={80}
                  height={innerHeight + 40}
                  fill="transparent"
                  onMouseEnter={() => setHoveredKey(risk.key)}
                  onMouseLeave={() => setHoveredKey(null)}
                  onClick={() => setPinnedKey((prev) => (prev === risk.key ? null : risk.key))}
                  style={{ cursor: 'pointer' }}
                />

                {/* svislá zvýrazňující linka */}
                {isActive && (
                  <line
                    x1={x}
                    x2={x}
                    y1={padTop - 10}
                    y2={padTop + innerHeight + 6}
                    stroke={risk.color}
                    strokeWidth={isPinned ? 1.5 : 1}
                    strokeDasharray={isPinned ? '5 4' : '3 3'}
                    opacity={isPinned ? 0.7 : 0.4}
                  />
                )}

                {/* label nad osou — rotovaný */}
                <g transform={`translate(${x},${padTop - 6})`} style={{ pointerEvents: 'none' }}>
                  <text
                    textAnchor="start"
                    fontSize={10}
                    fontWeight={isActive ? 700 : 600}
                    fill={isActive ? risk.color : '#162459'}
                    transform="rotate(-32) translate(5 0)"
                  >
                    {risk.short}
                  </text>
                </g>
              </g>
            )
          })}

          {/* Per varianta: její body — bez per-bod tooltipů, info v sjednoceném panelu */}
          {variantSeries.map(({ variantIdx, color, pts }) => {
            const dim = selectedIdx >= 0 && selectedIdx !== variantIdx
            const variantOpacity = dim ? 0.35 : 1
            return (
              <g
                key={`points-${variantIdx}`}
                opacity={variantOpacity}
                style={{ transition: 'opacity 0.3s ease', pointerEvents: 'none' }}
              >
                {pts.map(({ x, y, risk, amount }) => {
                  const isActiveZone = activeKey === risk.key
                  const isSelectedVariant = selectedIdx === variantIdx
                  const r = isActiveZone ? 6 : isSelectedVariant ? 5 : 4
                  return (
                    <circle
                      key={`pt-${variantIdx}-${risk.key}`}
                      cx={x}
                      cy={y}
                      r={r}
                      fill={amount > 0 ? color : '#cbd5e1'}
                      stroke="#fff"
                      strokeWidth={1.5}
                      style={{ transition: 'cx 0.45s ease, cy 0.45s ease, r 0.2s ease' }}
                    />
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

        {/* ─── Sjednocený info-panel vpravo dole ───────────────────── */}
        {(() => {
          const activeRisk = activeKey ? ORDERED_RISKS.find((r) => r.key === activeKey) : null
          if (!activeRisk) {
            return (
              <div className="absolute bottom-4 right-4 max-w-xs rounded-xl bg-white/95 backdrop-blur-sm border border-dashed border-[#E8E9EE] px-4 py-3 text-xs text-[#818EAF] leading-relaxed pointer-events-none hidden lg:block">
                Najeď myší na bod na ose. Pro zafixování klikni.
              </div>
            )
          }
          const Icon = activeRisk.icon
          const isPinned = pinnedKey === activeRisk.key
          // Spočti částky per varianta a najdi max pro highlight
          const rows = variants.map((v, idx) => ({
            variant: v,
            color: VARIANT_COLORS[idx] ?? '#162459',
            amount: calcAmount(v, activeRisk),
            isSelected: selectedVariantId === v.id,
          }))
          const maxAmt = Math.max(...rows.map((r) => r.amount), 0)
          return (
            <div
              className="absolute bottom-3 right-3 w-[260px] sm:w-[290px] rounded-xl bg-white border-2 shadow-xl overflow-hidden"
              style={{
                borderColor: `${activeRisk.color}55`,
                // pinned = klient může klikat (zavřít, vybrat); hovered = nesmí blokovat hover na grafu pod ním
                pointerEvents: isPinned ? 'auto' : 'none',
              }}
            >
              <div className="flex items-start gap-3 p-4" style={{ background: `${activeRisk.color}0d` }}>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
                  style={{ background: activeRisk.color }}
                >
                  <Icon className="w-5 h-5" strokeWidth={1.8} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[#162459] font-semibold text-sm">{activeRisk.label}</h4>
                  <p className="text-[11px] text-[#818EAF] mt-1 leading-snug">
                    {activeRisk.description}
                  </p>
                </div>
                {isPinned && (
                  <button
                    type="button"
                    onClick={() => setPinnedKey(null)}
                    aria-label="Zavřít"
                    className="text-[#818EAF] hover:text-[#162459] text-xs leading-none"
                  >
                    ✕
                  </button>
                )}
              </div>
              <div className="p-3 space-y-1.5">
                {rows.map((r) => {
                  const pct = maxAmt > 0 ? (r.amount / maxAmt) * 100 : 0
                  return (
                    <div
                      key={r.variant.id}
                      className="rounded-lg px-2.5 py-2"
                      style={{
                        background: r.isSelected ? '#16a34a0c' : 'transparent',
                        border: r.isSelected ? '1px solid #16a34a55' : '1px solid transparent',
                      }}
                    >
                      <div className="flex items-center justify-between gap-2 text-xs mb-1">
                        <span className="inline-flex items-center gap-1.5 truncate">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: r.color }} />
                          <span className="font-medium text-[#162459] truncate">{r.variant.company}</span>
                          {r.isSelected && (
                            <span className="text-[9px] uppercase tracking-wide text-[#15803d] font-semibold shrink-0">vybráno</span>
                          )}
                        </span>
                        <span className="font-semibold text-[#162459] tabular-nums shrink-0">
                          {r.amount > 0
                            ? compactCzk(r.amount) + (activeRisk.unit === 'daily' ? '/měs' : '')
                            : '—'}
                        </span>
                      </div>
                      <div className="h-1 rounded-full bg-[#f1f3f8] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, background: r.color }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="px-4 py-2 text-[10px] text-[#818EAF] text-center border-t border-[#E8E9EE]">
                {isPinned ? 'Klikni jinam pro odpíchnutí' : 'Klikni pro zafixování'}
              </div>
            </div>
          )
        })()}
      </div>
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
