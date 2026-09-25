import { RISK_DEFS, RISK_GROUPS, castkaRizika, type RiskDef, type RiskKey, type VolbyKryti } from '@/lib/income-risks'
import { BARVY } from '@/lib/barvy'

/**
 * „Proti čemu vás pojistka chrání“ — pojistné částky rozdělené do skupin
 * (denní dávky, jednorázové plnění, invalidita, smrt).
 *
 * Vytaženo z grafu u zajištění příjmu, protože stejný blok patří i k hotové
 * smlouvě v sekci Moje smlouvy. Klient tak vidí sjednané krytí popsané
 * přesně těmi slovy, podle kterých se rozhodoval v plánu.
 *
 * Skupina bez jediné vyplněné částky se nevykreslí — prázdné nadpisy jen
 * budí dojem, že něco chybí.
 *
 * Stejné karty má smlouva převedená z plánu i ručně zadaná smlouva, včetně
 * volby plnění („od 29. dne“, „klesající pojistná částka“).
 */

export type CastkyKryti = Partial<Record<RiskKey, number | null | undefined>>

export default function KrytiPojistky({
  castky,
  volby = {},
  titulek = 'Proti čemu vás pojistka chrání',
  podtitulek,
  zvyraznit = false,
}: {
  castky: CastkyKryti
  /** Volba plnění u položky, třeba { daily_sick_leave: 'od 29. dne' }. */
  volby?: VolbyKryti
  titulek?: string
  podtitulek?: React.ReactNode
  /** Barevné karty místo neutrálních – v plánu značí vybranou variantu. */
  zvyraznit?: boolean
}) {
  const jeVyplnene = (r: RiskDef) => {
    const v = castky[r.key]
    return typeof v === 'number' && v > 0
  }
  if (!RISK_DEFS.some(jeVyplnene)) return null

  return (
    // Sloupce podle šířky bloku, ne okna: v detailu smlouvy vedle postranního
    // menu je blok úzký a tři karty vedle sebe by přetékaly.
    <div className="@container rounded-card border border-line bg-surface p-4 md:p-6">
      <div className="mb-5">
        <h3 className="text-navy font-display text-base font-semibold">{titulek}</h3>
        {podtitulek && <p className="text-xs text-slate mt-0.5">{podtitulek}</p>}
      </div>

      <div className="space-y-5">
        {RISK_GROUPS.map((g) => {
          const polozky = RISK_DEFS.filter((r) => r.group === g.id).filter(jeVyplnene)
          if (polozky.length === 0) return null

          return (
            <div key={g.id}>
              {/* V úzkém bloku podtitulek pod nadpis – vedle by nadpis zalomil do tří řádků. */}
              <div className="flex flex-col gap-0.5 @md:flex-row @md:items-baseline @md:justify-between @md:gap-3 mb-2.5">
                <h4 className="text-xs uppercase tracking-[0.15em] text-slate font-semibold">{g.label}</h4>
                <span className="text-[11px] text-slate/80 @md:text-right">{g.subtitle}</span>
              </div>
              <div className="grid grid-cols-1 @lg:grid-cols-2 @3xl:grid-cols-3 gap-3">
                {polozky.map((r) => (
                  <KartaRizika
                    key={r.key}
                    def={r}
                    value={castky[r.key] as number}
                    volba={volby[r.key]}
                    highlighted={zvyraznit}
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

function KartaRizika({
  def,
  value,
  volba,
  highlighted,
}: {
  def: RiskDef
  value: number
  volba?: string
  highlighted: boolean
}) {
  const Icon = def.icon
  const formatted = castkaRizika(def, value)

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
          <Icon className="w-4 h-4" strokeWidth={1.8} aria-hidden />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5 mb-0.5">
            <span className="text-[13px] font-semibold text-navy leading-tight">{def.short}</span>
            <span className="text-[13px] font-semibold tabular-nums whitespace-nowrap" style={{ color: def.color }}>
              {formatted}
            </span>
          </div>
          {volba && <p className="text-[12px] font-medium text-navy leading-snug mb-0.5">{volba}</p>}
          <p className="text-[11px] text-slate leading-snug">{def.description}</p>
        </div>
      </div>
    </div>
  )
}
