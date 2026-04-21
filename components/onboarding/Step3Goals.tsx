'use client'

import { ArrowLeft, ArrowRight } from 'lucide-react'
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
      ? current.filter((g) => g !== value)
      : [...current, value]
    onChange({ goals: updated })
  }

  return (
    <div className="bg-white rounded-3xl border border-[#E8E9EE] p-6 md:p-8">
      <h2
        className="font-display text-[#162459]"
        style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', letterSpacing: '-0.02em', lineHeight: 1.1 }}
      >
        Co vás <span style={{ fontStyle: 'italic', color: '#009EE2' }}>zajímá</span>?
      </h2>
      <p className="text-[#818EAF] text-sm mt-2 mb-7">Vyberte jednu nebo více oblastí — později je můžeme doplnit.</p>

      <div className="space-y-2 mb-6">
        {OPTIONS.map((opt) => {
          const checked = data.goals.includes(opt.value)
          return (
            <label
              key={opt.value}
              className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all border ${
                checked
                  ? 'border-[#009EE2] bg-[#009EE2]/8 shadow-[inset_0_0_0_1px_#009EE2]'
                  : 'border-[#E8E9EE] hover:border-[#009EE2]/50 hover:bg-[#f8f9fc]'
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(opt.value)}
                className="accent-[#009EE2] w-4 h-4"
              />
              <span className="text-2xl">{opt.icon}</span>
              <div>
                <div
                  className="font-display text-[#162459]"
                  style={{ fontSize: '1rem', letterSpacing: '-0.01em' }}
                >
                  {opt.label}
                </div>
                <div className="text-xs text-[#818EAF]">{opt.desc}</div>
              </div>
            </label>
          )
        })}
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 border border-[#E8E9EE] text-[#818EAF] hover:text-[#162459] text-sm font-medium rounded-xl hover:bg-[#f8f9fc] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Zpět
        </button>
        <button
          onClick={onNext}
          disabled={data.goals.length === 0}
          className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-white text-sm transition-all disabled:opacity-40 hover:shadow-lg hover:shadow-[#009EE2]/25"
          style={{ background: 'linear-gradient(135deg, #009EE2, #0088c6)' }}
        >
          Pokračovat <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
