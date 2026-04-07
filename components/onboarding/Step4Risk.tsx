'use client'

import type { OnboardingData } from './OnboardingWizard'
import type { RiskProfile } from '@/lib/types/database'

const OPTIONS: { value: RiskProfile; label: string; desc: string; color: string }[] = [
  {
    value: 'conservative',
    label: 'Konzervativní',
    desc: 'Nechci riskovat, preferuji jistotu i za cenu nižšího výnosu',
    color: 'green',
  },
  {
    value: 'moderate',
    label: 'Vyvážený',
    desc: 'Akceptuji mírné výkyvy, chci rozumný výnos',
    color: 'blue',
  },
  {
    value: 'balanced',
    label: 'Dynamický',
    desc: 'Nevadí mi větší výkyvy, hledám vyšší výnos',
    color: 'orange',
  },
  {
    value: 'aggressive',
    label: 'Agresivní',
    desc: 'Chci maximální výnos, připraven/a i na výrazný pokles',
    color: 'red',
  },
]

const COLOR_MAP: Record<string, string> = {
  green: 'border-green-500 bg-green-50',
  blue: 'border-blue-500 bg-blue-50',
  orange: 'border-orange-500 bg-orange-50',
  red: 'border-red-500 bg-red-50',
}

export default function Step4Risk({
  data,
  onChange,
  onFinish,
  onBack,
  saving,
}: {
  data: OnboardingData
  onChange: (partial: Partial<OnboardingData>) => void
  onFinish: () => void
  onBack: () => void
  saving: boolean
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
      <h2 className="text-xl font-bold text-slate-900 mb-1">Váš vztah k riziku</h2>
      <p className="text-slate-500 text-sm mb-6">Jak se cítíte ohledně investičního rizika?</p>

      <div className="space-y-3 mb-6">
        {OPTIONS.map(opt => {
          const selected = data.risk_profile === opt.value
          return (
            <button
              key={opt.value}
              onClick={() => onChange({ risk_profile: opt.value })}
              className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                selected ? COLOR_MAP[opt.color] : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="font-medium text-slate-900">{opt.label}</div>
              <div className="text-sm text-slate-500 mt-0.5">{opt.desc}</div>
            </button>
          )
        })}
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 py-2.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors"
        >
          Zpět
        </button>
        <button
          onClick={onFinish}
          disabled={!data.risk_profile || saving}
          className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors disabled:opacity-40"
        >
          {saving ? 'Ukládám...' : 'Dokončit dotazník'}
        </button>
      </div>
    </div>
  )
}
