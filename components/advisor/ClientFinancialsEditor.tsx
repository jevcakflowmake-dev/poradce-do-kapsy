'use client'

import { useState, useCallback } from 'react'
import { Save, ChevronDown, ChevronUp, Check, Loader2, UserCog } from 'lucide-react'

export interface ClientFinancials {
  id?: string
  client_id: string
  age: number | null
  retirement_age: number | null
  monthly_income_net: number | null
  dependents_count: number | null
  has_mortgage: boolean
  mortgage_remaining_amount: number | null
  mortgage_remaining_years: number | null
  property_value_real_estate: number | null
  property_value_movables: number | null
  notes: string | null
}

interface Props {
  clientId: string
  initial: ClientFinancials | null
}

const DEFAULTS: Omit<ClientFinancials, 'client_id'> = {
  id: undefined,
  age: null,
  retirement_age: 65,
  monthly_income_net: null,
  dependents_count: 0,
  has_mortgage: false,
  mortgage_remaining_amount: null,
  mortgage_remaining_years: null,
  property_value_real_estate: null,
  property_value_movables: null,
  notes: null,
}

export default function ClientFinancialsEditor({ clientId, initial }: Props) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<ClientFinancials>({
    ...DEFAULTS,
    ...(initial ?? {}),
    client_id: clientId,
  })

  const update = useCallback(<K extends keyof ClientFinancials>(key: K, value: ClientFinancials[K]) => {
    setData((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }, [])

  const onSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/advisor/client-financials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Uložení selhalo')
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba při ukládání')
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
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
          style={{ background: 'linear-gradient(135deg, #162459, #243471)' }}>
          <UserCog className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-[#162459] font-display text-lg font-semibold">Vstupní data klienta</h2>
          <p className="text-xs text-[#818EAF] mt-0.5">
            {data.age && data.monthly_income_net
              ? `${data.age} let · příjem ${Math.round(data.monthly_income_net).toLocaleString('cs-CZ')} Kč/měs${data.dependents_count ? ` · ${data.dependents_count} ${data.dependents_count === 1 ? 'dítě' : 'děti'}` : ''}`
              : 'Vyplňte věk, příjem, počet dětí a majetkové údaje z analýzy klienta.'}
          </p>
        </div>
        {open ? <ChevronUp className="w-5 h-5 text-[#0088c6]" /> : <ChevronDown className="w-5 h-5 text-[#818EAF]" />}
      </button>

      {open && (
        <div className="border-t border-[#E8E9EE] p-5 md:p-6 space-y-5">
          <Group title="Klient">
            <NumField label="Věk" value={data.age} onChange={(v) => update('age', v)} suffix="let" />
            <NumField label="Cíl. věk důchodu" value={data.retirement_age} onChange={(v) => update('retirement_age', v)} suffix="let" />
            <NumField label="Měsíční čistý příjem" value={data.monthly_income_net} onChange={(v) => update('monthly_income_net', v)} suffix="Kč" />
            <NumField label="Počet dětí" value={data.dependents_count} onChange={(v) => update('dependents_count', v)} />
          </Group>

          <Group title="Hypotéka">
            <CheckField label="Klient má hypotéku" checked={data.has_mortgage} onChange={(v) => update('has_mortgage', v)} />
            {data.has_mortgage && (
              <>
                <NumField label="Zbývá doplatit" value={data.mortgage_remaining_amount} onChange={(v) => update('mortgage_remaining_amount', v)} suffix="Kč" />
                <NumField label="Zbývá doba" value={data.mortgage_remaining_years} onChange={(v) => update('mortgage_remaining_years', v)} suffix="let" />
              </>
            )}
          </Group>

          <Group title="Majetek">
            <NumField label="Hodnota nemovitosti" value={data.property_value_real_estate} onChange={(v) => update('property_value_real_estate', v)} suffix="Kč" />
            <NumField label="Hodnota movitého majetku" value={data.property_value_movables} onChange={(v) => update('property_value_movables', v)} suffix="Kč" />
          </Group>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.15em] text-[#818EAF] mb-2">
              Poznámka
            </label>
            <textarea
              value={data.notes ?? ''}
              onChange={(e) => update('notes', e.target.value || null)}
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-[#E8E9EE] bg-white text-[#162459] text-[14px] placeholder:text-[#818EAF] focus:outline-none focus:border-[#009EE2] focus:ring-4 focus:ring-[#009EE2]/10 transition-all resize-none"
              placeholder="Cokoliv užitečného z analýzy klienta…"
            />
          </div>

          {error && (
            <div className="px-4 py-3 bg-[rgba(234,88,12,0.08)] border border-[rgba(234,88,12,0.3)] rounded-xl text-sm text-[#c2410c]">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            {saved && <span className="text-sm text-[#15803d] inline-flex items-center gap-1"><Check className="w-4 h-4" /> Uloženo</span>}
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white text-sm transition-all disabled:opacity-50 hover:shadow-lg hover:shadow-[#009EE2]/25 hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #009EE2, #0088c6)' }}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Uložit vstupní data
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-[#818EAF] mb-3">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{children}</div>
    </div>
  )
}

function NumField({
  label,
  value,
  onChange,
  suffix,
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
          className="w-full h-10 px-3 pr-12 rounded-xl border border-[#E8E9EE] bg-white text-[#162459] text-[15px] focus:outline-none focus:border-[#009EE2] focus:ring-2 focus:ring-[#009EE2]/10 transition-all"
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#818EAF]">{suffix}</span>
        )}
      </div>
    </div>
  )
}

function CheckField({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer col-span-full">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded border-[#E8E9EE] text-[#009EE2] focus:ring-2 focus:ring-[#009EE2]/30"
      />
      <span className="text-sm text-[#162459]">{label}</span>
    </label>
  )
}
