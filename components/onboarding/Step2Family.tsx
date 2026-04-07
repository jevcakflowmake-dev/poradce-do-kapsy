'use client'

import type { OnboardingData } from './OnboardingWizard'
import type { FamilyStatus } from '@/lib/types/database'

const OPTIONS: { value: FamilyStatus; label: string; desc: string; icon: string }[] = [
  { value: 'single', label: 'Single', desc: 'Bydlím sám/sama', icon: '👤' },
  { value: 'partner', label: 'S partnerem/kou', desc: 'Žijeme spolu bez dětí', icon: '👫' },
  { value: 'family', label: 'Rodina s dětmi', desc: 'Máme děti', icon: '👨‍👩‍👧' },
  { value: 'single_parent', label: 'Samoživitel/ka', desc: 'Sám/sama s dítětem', icon: '👩‍👦' },
]

export default function Step2Family({
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
  function select(value: FamilyStatus) {
    onChange({ family_status: value })
    setTimeout(onNext, 200)
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
      <h2 className="text-xl font-bold text-slate-900 mb-1">Rodinná situace</h2>
      <p className="text-slate-500 text-sm mb-6">Klikněte na vaši situaci</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => select(opt.value)}
            className={`p-5 rounded-xl border-2 text-left transition-all ${
              data.family_status === opt.value
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-200 hover:border-blue-300'
            }`}
          >
            <div className="text-3xl mb-2">{opt.icon}</div>
            <div className="font-medium text-slate-900 text-sm">{opt.label}</div>
            <div className="text-xs text-slate-500 mt-0.5">{opt.desc}</div>
          </button>
        ))}
      </div>

      <button
        onClick={onBack}
        className="w-full py-2.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors"
      >
        Zpět
      </button>
    </div>
  )
}
