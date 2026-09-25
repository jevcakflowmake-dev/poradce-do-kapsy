'use client'

import { useState, useCallback, useId } from 'react'
import { Shield, Save, Plus, Trash2, Loader2, Check, ChevronDown, ChevronUp } from 'lucide-react'
import { partnerPodleNazvu } from '@/lib/partneri'
import LogoFirmy from '@/components/partneri/LogoFirmy'
import SeznamPartneru from '@/components/partneri/SeznamPartneru'
import { RISK_DEFS, RISK_GROUPS, type RiskKey } from '@/lib/income-risks'
import type { Json } from '@/lib/types/database'
import { BARVY } from '@/lib/barvy'

type Coverage = Partial<Record<RiskKey, number | null>>

interface VariantInput {
  id?: string
  company: string
  logo: string
  monthly_payment: string
  waiting_period_days: number | null
  max_payout_years: number | null
  accident_pn_combine: boolean
  coverage: Coverage
}

/** Tvar sloupce `details` (jsonb). Databáze ho nehlídá, hlídá si ho editor. */
type Details = {
  payout_60?: number | null  // serverside vypočítaný – read only
  payout_50?: number | null
  waiting_period_days?: number | null
  max_payout_years?: number | null
  accident_pn_combine?: boolean
} & Coverage

export interface ExistingVariant {
  id: string
  company: string
  logo: string
  monthly_payment: string
  details: Json | null
}

function detailsOf(details: Json | null): Details {
  return details && typeof details === 'object' && !Array.isArray(details) ? (details as Details) : {}
}

const DEFAULT_WAITING_PERIOD_DAYS = 14
const DAYS_IN_MONTH = 30

interface Props {
  clientId: string
  initial: ExistingVariant[]
  monthlyIncomeNet: number | null
}

const EMPTY: VariantInput = {
  company: '',
  logo: '',
  monthly_payment: '',
  waiting_period_days: null,
  max_payout_years: null,
  accident_pn_combine: false,
  coverage: {},
}

function extractCoverage(details: ExistingVariant['details']): Coverage {
  if (!details) return {}
  const cov: Coverage = {}
  RISK_DEFS.forEach((r) => {
    const v = (details as Record<string, unknown>)[r.key]
    if (typeof v === 'number') cov[r.key] = v
    else if (v === null) cov[r.key] = null
  })
  return cov
}

export default function IncomeProtectionEditor({ clientId, initial, monthlyIncomeNet }: Props) {
  const [open, setOpen] = useState(true)
  const [variants, setVariants] = useState<VariantInput[]>(() =>
    initial.length > 0
      ? initial.map((v) => {
          const d = detailsOf(v.details)
          return {
            id: v.id,
            company: v.company,
            logo: v.logo,
            monthly_payment: v.monthly_payment,
            waiting_period_days: d.waiting_period_days ?? null,
            max_payout_years: d.max_payout_years ?? null,
            accident_pn_combine: Boolean(d.accident_pn_combine),
            coverage: extractCoverage(d),
          }
        })
      : [{ ...EMPTY }],
  )
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Uložené varianty, které poradce odebral – smažou se až při uložení.
  const [odebrane, setOdebrane] = useState<string[]>([])

  const update = useCallback(<K extends keyof VariantInput>(idx: number, key: K, value: VariantInput[K]) => {
    setVariants((prev) => prev.map((v, i) => (i === idx ? { ...v, [key]: value } : v)))
    setSaved(false)
  }, [])

  const addVariant = () => {
    if (variants.length >= 3) return
    setVariants((prev) => [...prev, { ...EMPTY }])
    setSaved(false)
  }

  const removeVariant = (idx: number) => {
    const id = variants[idx]?.id
    if (id) setOdebrane((prev) => [...prev, id])
    setVariants((prev) => prev.filter((_, i) => i !== idx))
    setSaved(false)
  }

  const onSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const vyplnena = (v: VariantInput) => Boolean(v.company.trim() && v.monthly_payment.trim())
      const filled = variants.filter(vyplnena)
      // Uložená varianta, kterou poradce vyprázdnil, se maže stejně jako odebraná.
      const kOdebrani = [...odebrane, ...variants.filter((v) => v.id && !vyplnena(v)).map((v) => v.id as string)]
      const res = await fetch('/api/advisor/plan/income', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId, variants: filled, odebrane: kOdebrani }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Uložení selhalo')
      // Nově vložené varianty dostanou id, aby další uložení je upravilo, ne zdvojilo.
      const ulozene = (json.data ?? []) as Array<{ id: string }>
      setVariants((prev) => {
        // Počítadlo uvnitř: React smí aktualizaci zavolat dvakrát (Strict Mode).
        let poradi = 0
        return prev
          .filter((v) => vyplnena(v) || !v.id)
          .map((v) => (vyplnena(v) ? { ...v, id: ulozene[poradi++]?.id ?? v.id } : v))
      })
      setOdebrane([])
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="bg-surface rounded-card border border-line mb-6 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-4 p-5 md:p-6 text-left hover:bg-cream transition-colors"
      >
        <div
          className="w-10 h-10 rounded-card flex items-center justify-center text-white shrink-0"
          style={{ background: BARVY.navy }}
        >
          <Shield className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-navy font-display text-lg">Zajištění příjmu – graf života</h2>
          <p className="text-xs text-slate mt-0.5">
            {variants.filter((v) => v.company.trim()).length === 0
              ? 'Přidejte až 3 varianty pojistky – klient uvidí graf „kolik mu zůstane při poklesu na 60 % a 50 %“.'
              : `${variants.filter((v) => v.company.trim()).length}/3 variant nahráno`}
          </p>
        </div>
        {open ? <ChevronUp className="w-5 h-5 text-navy" /> : <ChevronDown className="w-5 h-5 text-slate" />}
      </button>

      {open && (
        <div className="border-t border-line p-5 md:p-6 space-y-5">
          {monthlyIncomeNet === null && (
            <div className="px-4 py-3 bg-[rgba(242,180,65,0.08)] border border-[rgba(242,180,65,0.3)] rounded-card text-sm text-navy">
              ⚠ Pro graf života je třeba nejdřív vyplnit <strong>Čistý měsíční příjem</strong> ve vstupních datech klienta výše.
            </div>
          )}

          {monthlyIncomeNet !== null && (
            <div className="rounded-card bg-cream border border-line px-4 py-3 text-sm text-navy/80">
              Klient má příjem <strong className="text-navy">{Math.round(monthlyIncomeNet).toLocaleString('cs-CZ')} Kč</strong> měsíčně.
              Při poklesu na 60 % mu bude chybět ~<strong>{Math.round(monthlyIncomeNet * 0.4).toLocaleString('cs-CZ')} Kč</strong>, při 50 % ~<strong>{Math.round(monthlyIncomeNet * 0.5).toLocaleString('cs-CZ')} Kč</strong> měsíčně.
            </div>
          )}

          <div className="space-y-4">
            {variants.map((v, idx) => (
              <VariantCard
                key={v.id ?? idx}
                index={idx}
                variant={v}
                onChange={(key, value) => update(idx, key, value)}
                onRemove={() => removeVariant(idx)}
                canRemove={variants.length > 1}
              />
            ))}
          </div>

          {variants.length < 3 && (
            <button
              type="button"
              onClick={addVariant}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-card border border-dashed border-mint/40 text-navy hover:bg-mint/5 hover:border-mint text-sm font-medium transition-all"
            >
              <Plus className="w-4 h-4" />
              Přidat variantu ({variants.length}/3)
            </button>
          )}

          {error && (
            <div className="px-4 py-3 bg-[rgba(194,65,12,0.08)] border border-[rgba(194,65,12,0.3)] rounded-card text-sm text-danger">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            {saved && (
              <span className="text-sm text-navy inline-flex items-center gap-1">
                <Check className="w-4 h-4" /> Uloženo
              </span>
            )}
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-card font-semibold text-white text-sm transition-all disabled:opacity-50 hover:shadow-lg hover:shadow-mint/25 hover:-translate-y-0.5"
              style={{ background: BARVY.navy }}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Uložit varianty pojistky
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

function VariantCard({
  index,
  variant,
  onChange,
  onRemove,
  canRemove,
}: {
  index: number
  variant: VariantInput
  onChange: <K extends keyof VariantInput>(key: K, value: VariantInput[K]) => void
  onRemove: () => void
  canRemove: boolean
}) {
  const idPartneru = useId()
  const partner = partnerPodleNazvu(variant.company)
  return (
    <div className="rounded-card border border-line p-4 md:p-5 bg-surface">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-navy">Varianta {index + 1}</h3>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-slate hover:text-danger transition-colors"
            aria-label="Odebrat variantu"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <TextField
          label="Pojišťovna"
          value={variant.company}
          onChange={(v) => onChange('company', v)}
          placeholder="Začněte psát, třeba Allianz"
          list={idPartneru}
        />
        <SeznamPartneru id={idPartneru} />
        {/* Partnera klient uvidí s logem; zkratka jen u ostatních. */}
        {partner ? (
          <div>
            <span className="block text-xs text-navy/70 mb-1">Logo</span>
            <div className="flex items-center gap-3">
              <LogoFirmy firma={variant.company} />
              <span className="text-xs text-slate text-pretty">Klient uvidí logo společnosti {partner.nazev}.</span>
            </div>
          </div>
        ) : (
          <TextField label="Zkratka místo loga" value={variant.logo} onChange={(v) => onChange('logo', v)} placeholder="K" />
        )}
        <TextField label="Měsíční pojistné" value={variant.monthly_payment} onChange={(v) => onChange('monthly_payment', v)} placeholder="850 Kč" />
      </div>

      {/* Modelace výpočtu – checkbox + read-only preview */}
      {(() => {
        const karence = variant.waiting_period_days ?? DEFAULT_WAITING_PERIOD_DAYS
        const da = variant.coverage.daily_accident ?? 0
        const ds = variant.coverage.daily_sick_leave ?? 0
        const pnAfterKar = ds * Math.max(0, DAYS_IN_MONTH - karence)
        const payout60 = Math.round(da * DAYS_IN_MONTH + (variant.accident_pn_combine ? pnAfterKar : 0))
        const payout50 = Math.round(pnAfterKar)
        return (
          <div className="rounded-card bg-mint/5 border border-mint/20 px-4 py-3 mb-4 text-xs text-navy/85 leading-relaxed">
            <div className="font-semibold text-navy mb-2">Modelace výpočtu pro graf života</div>
            <label className="flex items-start gap-2 cursor-pointer mb-3">
              <input
                type="checkbox"
                checked={variant.accident_pn_combine}
                onChange={(e) => onChange('accident_pn_combine', e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-line text-navy focus:ring-2 focus:ring-mint/30"
              />
              <span className="text-[12px] text-navy/90 leading-snug">
                Při úrazu se sčítá <strong>úrazové denní odškodné + pracovní neschopenka</strong>
                <span className="text-slate">{' '}(klient dostává obojí naráz)</span>
              </span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate">Pokles 60 % (úraz):</span>{' '}
                <strong className="text-navy">{payout60.toLocaleString('cs-CZ')} Kč/měs.</strong>
                <div className="text-[10px] text-slate/80 mt-0.5">
                  úrazové × {DAYS_IN_MONTH}
                  {variant.accident_pn_combine && (
                    <> + PN × ({DAYS_IN_MONTH} − {karence})</>
                  )}
                </div>
              </div>
              <div>
                <span className="text-slate">Pokles 50 % (nemoc):</span>{' '}
                <strong className="text-navy">{payout50.toLocaleString('cs-CZ')} Kč/měs.</strong>
                <div className="text-[10px] text-slate/80 mt-0.5">PN × ({DAYS_IN_MONTH} − {karence}) dnů</div>
              </div>
            </div>
          </div>
        )
      })()}

      <h4 className="text-xs font-semibold uppercase tracking-[0.15em] text-slate mb-2">Pojistné krytí (10 typů rizik)</h4>
      <div className="space-y-3">
        {RISK_GROUPS.map((g) => {
          const risks = RISK_DEFS.filter((r) => r.group === g.id)
          return (
            <div key={g.id} className="rounded-card bg-surface border border-line p-3">
              <div className="text-[11px] uppercase tracking-[0.15em] text-slate mb-2">{g.label}</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {risks.map((r) => (
                  <NumField
                    key={r.key}
                    label={r.label}
                    value={variant.coverage[r.key] ?? null}
                    onChange={(v) =>
                      onChange('coverage', { ...variant.coverage, [r.key]: v })
                    }
                    suffix={r.unit === 'daily' ? 'Kč/den' : 'Kč'}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <details className="text-sm mt-3">
        <summary className="cursor-pointer text-xs text-navy hover:text-navy">Pokročilé parametry</summary>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <NumField label="Karenční doba" value={variant.waiting_period_days} onChange={(v) => onChange('waiting_period_days', v)} suffix="dní" />
          <NumField label="Max. délka výplaty" value={variant.max_payout_years} onChange={(v) => onChange('max_payout_years', v)} suffix="let" />
        </div>
      </details>
    </div>
  )
}

function TextField({
  label, value, onChange, placeholder, list,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  /** id datalistu s nabídkou hodnot. */
  list?: string
}) {
  return (
    <label className="block">
      <span className="block text-xs text-navy/70 mb-1">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        list={list}
        className="w-full h-10 px-3 rounded-card border border-line bg-surface text-navy text-[15px] focus:outline-none focus:border-mint focus:ring-2 focus:ring-mint/10 transition-all"
      />
    </label>
  )
}

function NumField({
  label, value, onChange, suffix,
}: {
  label: string
  value: number | null
  onChange: (v: number | null) => void
  suffix?: string
}) {
  return (
    <div>
      <label className="block text-xs text-navy/70 mb-1">{label}</label>
      <div className="relative">
        <input
          type="number"
          inputMode="numeric"
          value={value ?? ''}
          onChange={(e) => {
            const raw = e.target.value
            onChange(raw === '' ? null : Number(raw))
          }}
          className="w-full h-10 px-3 pr-14 rounded-card border border-line bg-surface text-navy text-[15px] focus:outline-none focus:border-mint focus:ring-2 focus:ring-mint/10 transition-all"
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate">{suffix}</span>
        )}
      </div>
    </div>
  )
}
