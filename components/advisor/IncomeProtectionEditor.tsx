'use client'

import { useState, useCallback } from 'react'
import { Shield, Save, Plus, Trash2, Loader2, Check, ChevronDown, ChevronUp } from 'lucide-react'
import { RISK_DEFS, RISK_GROUPS, type RiskKey } from '@/lib/income-risks'

type Coverage = Partial<Record<RiskKey, number | null>>

interface VariantInput {
  id?: string
  company: string
  logo: string
  monthly_payment: string
  payout_60: number | null
  payout_50: number | null
  waiting_period_days: number | null
  max_payout_years: number | null
  coverage: Coverage
}

interface ExistingVariant {
  id: string
  company: string
  logo: string
  monthly_payment: string
  details: ({
    payout_60?: number | null
    payout_50?: number | null
    waiting_period_days?: number | null
    max_payout_years?: number | null
  } & Coverage) | null
}

interface Props {
  clientId: string
  initial: ExistingVariant[]
  monthlyIncomeNet: number | null
}

const EMPTY: VariantInput = {
  company: '',
  logo: '',
  monthly_payment: '',
  payout_60: null,
  payout_50: null,
  waiting_period_days: null,
  max_payout_years: null,
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
      ? initial.map((v) => ({
          id: v.id,
          company: v.company,
          logo: v.logo,
          monthly_payment: v.monthly_payment,
          payout_60: v.details?.payout_60 ?? null,
          payout_50: v.details?.payout_50 ?? null,
          waiting_period_days: v.details?.waiting_period_days ?? null,
          max_payout_years: v.details?.max_payout_years ?? null,
          coverage: extractCoverage(v.details),
        }))
      : [{ ...EMPTY }],
  )
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    setVariants((prev) => prev.filter((_, i) => i !== idx))
    setSaved(false)
  }

  const onSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const filled = variants.filter((v) => v.company.trim() && v.monthly_payment.trim())
      const res = await fetch('/api/advisor/plan/income', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId, variants: filled }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Uložení selhalo')
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="bg-white rounded-3xl border border-[#E8E9EE] mb-6 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-4 p-5 md:p-6 text-left hover:bg-[#f8f9fc] transition-colors"
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
          style={{ background: 'linear-gradient(135deg, #162459, #243471)' }}
        >
          <Shield className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-[#162459] font-display text-lg font-semibold">Zajištění příjmu — graf života</h2>
          <p className="text-xs text-[#818EAF] mt-0.5">
            {variants.filter((v) => v.company.trim()).length === 0
              ? 'Přidejte až 3 varianty pojistky — klient uvidí graf "kolik mu zůstane při poklesu na 60% a 50%".'
              : `${variants.filter((v) => v.company.trim()).length}/3 variant nahrato`}
          </p>
        </div>
        {open ? <ChevronUp className="w-5 h-5 text-[#0088c6]" /> : <ChevronDown className="w-5 h-5 text-[#818EAF]" />}
      </button>

      {open && (
        <div className="border-t border-[#E8E9EE] p-5 md:p-6 space-y-5">
          {monthlyIncomeNet === null && (
            <div className="px-4 py-3 bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.3)] rounded-xl text-sm text-[#b45309]">
              ⚠ Pro graf života je třeba nejdřív vyplnit <strong>Měsíční čistý příjem</strong> ve vstupních datech klienta výše.
            </div>
          )}

          {monthlyIncomeNet !== null && (
            <div className="rounded-2xl bg-[#f8f9fc] border border-[#E8E9EE] px-4 py-3 text-sm text-[#162459]/80">
              Klient má příjem <strong className="text-[#162459]">{Math.round(monthlyIncomeNet).toLocaleString('cs-CZ')} Kč/měs</strong>.
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
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-[#009EE2]/40 text-[#0088c6] hover:bg-[#009EE2]/5 hover:border-[#009EE2] text-sm font-medium transition-all"
            >
              <Plus className="w-4 h-4" />
              Přidat variantu ({variants.length}/3)
            </button>
          )}

          {error && (
            <div className="px-4 py-3 bg-[rgba(234,88,12,0.08)] border border-[rgba(234,88,12,0.3)] rounded-xl text-sm text-[#c2410c]">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            {saved && (
              <span className="text-sm text-[#15803d] inline-flex items-center gap-1">
                <Check className="w-4 h-4" /> Uloženo
              </span>
            )}
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white text-sm transition-all disabled:opacity-50 hover:shadow-lg hover:shadow-[#009EE2]/25 hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #009EE2, #0088c6)' }}
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
  return (
    <div className="rounded-2xl border border-[#E8E9EE] p-4 md:p-5 bg-[#fcfcfd]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[#162459]">Varianta {index + 1}</h3>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-[#818EAF] hover:text-[#c2410c] transition-colors"
            aria-label="Odebrat variantu"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <TextField label="Pojišťovna" value={variant.company} onChange={(v) => onChange('company', v)} placeholder="Kooperativa" />
        <TextField label="Logo (zkratka/písmeno)" value={variant.logo} onChange={(v) => onChange('logo', v)} placeholder="K" />
        <TextField label="Měsíční pojistné" value={variant.monthly_payment} onChange={(v) => onChange('monthly_payment', v)} placeholder="850 Kč" />
      </div>

      <h4 className="text-xs font-semibold uppercase tracking-[0.15em] text-[#818EAF] mb-2">Souhrnná výplata pro graf života</h4>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <NumField label="Pokles na 60 % (úraz)" value={variant.payout_60} onChange={(v) => onChange('payout_60', v)} suffix="Kč/měs" />
        <NumField label="Pokles na 50 % (nemoc)" value={variant.payout_50} onChange={(v) => onChange('payout_50', v)} suffix="Kč/měs" />
      </div>

      <h4 className="text-xs font-semibold uppercase tracking-[0.15em] text-[#818EAF] mb-2">Pojistné krytí (10 typů rizik)</h4>
      <div className="space-y-3">
        {RISK_GROUPS.map((g) => {
          const risks = RISK_DEFS.filter((r) => r.group === g.id)
          return (
            <div key={g.id} className="rounded-xl bg-white border border-[#E8E9EE] p-3">
              <div className="text-[11px] uppercase tracking-[0.15em] text-[#818EAF] mb-2">{g.label}</div>
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
        <summary className="cursor-pointer text-xs text-[#0088c6] hover:text-[#162459]">Pokročilé parametry</summary>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <NumField label="Karenční doba" value={variant.waiting_period_days} onChange={(v) => onChange('waiting_period_days', v)} suffix="dní" />
          <NumField label="Max. délka výplaty" value={variant.max_payout_years} onChange={(v) => onChange('max_payout_years', v)} suffix="let" />
        </div>
      </details>
    </div>
  )
}

function TextField({
  label, value, onChange, placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div>
      <label className="block text-xs text-[#162459]/70 mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-10 px-3 rounded-xl border border-[#E8E9EE] bg-white text-[#162459] text-[15px] focus:outline-none focus:border-[#009EE2] focus:ring-2 focus:ring-[#009EE2]/10 transition-all"
      />
    </div>
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
      <label className="block text-xs text-[#162459]/70 mb-1">{label}</label>
      <div className="relative">
        <input
          type="number"
          inputMode="numeric"
          value={value ?? ''}
          onChange={(e) => {
            const raw = e.target.value
            onChange(raw === '' ? null : Number(raw))
          }}
          className="w-full h-10 px-3 pr-14 rounded-xl border border-[#E8E9EE] bg-white text-[#162459] text-[15px] focus:outline-none focus:border-[#009EE2] focus:ring-2 focus:ring-[#009EE2]/10 transition-all"
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#818EAF]">{suffix}</span>
        )}
      </div>
    </div>
  )
}
