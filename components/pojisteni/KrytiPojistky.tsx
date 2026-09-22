import { RISK_DEFS, RISK_GROUPS, type RiskDef, type RiskKey } from '@/lib/income-risks'
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
 */

export type CastkyKryti = Partial<Record<RiskKey, number | null | undefined>>

export default function KrytiPojistky({
  castky,
  titulek = 'Proti čemu vás pojistka chrání',
  podtitulek,
  zvyraznit = false,
}: {
  castky: CastkyKryti
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
    <div className="rounded-card border border-line bg-surface p-4 md:p-6">
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
              <div className="flex items-baseline justify-between gap-3 mb-2.5">
                <h4 className="text-xs uppercase tracking-[0.15em] text-slate font-semibold">{g.label}</h4>
                <span className="text-[11px] text-slate/80 text-right">{g.subtitle}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {polozky.map((r) => (
                  <KartaRizika
                    key={r.key}
                    def={r}
                    value={castky[r.key] as number}
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
  highlighted,
}: {
  def: RiskDef
  value: number
  highlighted: boolean
}) {
  const Icon = def.icon
  const formatted =
    def.unit === 'daily'
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
          <Icon className="w-4 h-4" strokeWidth={1.8} aria-hidden />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2 mb-0.5">
            <span className="text-[13px] font-semibold text-navy leading-tight">{def.short}</span>
            <span className="text-[13px] font-semibold tabular-nums" style={{ color: def.color }}>
              {formatted}
            </span>
          </div>
          <p className="text-[11px] text-slate leading-snug">{def.description}</p>
        </div>
      </div>
    </div>
  )
}
