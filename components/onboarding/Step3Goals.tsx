'use client'

import type { OnboardingData } from './OnboardingWizard'

const OPTIONS = [
  { value: 'insurance', label: 'Pojištění', desc: 'Životní, úrazové, nemocenské', icon: '🛡️' },
  { value: 'pension', label: 'Důchod', desc: 'Penzijní spoření, připojištění', icon: '🏖️' },
  { value: 'invest', label: 'Investice', desc: 'Podílové fondy, ETF', icon: '📈' },
  { value: 'mortgage', label: 'Hypotéka', desc: 'Vlastní bydlení, refinancování', icon: '🏠' },
  { value: 'savings', label: 'Stavební spoření', desc: 'Spoření na bydlení', icon: '🏦' },
]

export default function Step3Goals({
  data,
  onChange,
  onNext,
  onBack,
}: {
  data: OnboardingData
  onChange: (partial: Partial<OnboardingData>) => void
  onNext: () => void
  onBack: () => void
}) {
  function toggle(value: string) {
    const current = data.goals
    const updated = current.includes(value)
      ? current.filter(g => g !== value)
      : [...current, value]
    onChange({ goals: updated })
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
      <h2 className="text-xl font-bold text-slate-900 mb-1">Co vás zajímá?</h2>
      <p className="text-slate-500 text-sm mb-6">Vyberte jednu nebo více oblastí</p>

      <div className="space-y-2 mb-6">
        {OPTIONS.map(opt => {
          const checked = data.goals.includes(opt.value)
          return (
            <label
              key={opt.value}
              className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                checked ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300'
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(opt.value)}
                className="accent-blue-600 w-4 h-4"
              />
              <span className="text-2xl">{opt.icon}</span>
              <div>
                <div className="font-medium text-slate-900 text-sm">{opt.label}</div>
                <div className="text-xs text-slate-500">{opt.desc}</div>
              </div>
            </label>
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
          onClick={onNext}
          disabled={data.goals.length === 0}
          className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-40"
        >
          Pokračovat
        </button>
      </div>
    </div>
  )
}
