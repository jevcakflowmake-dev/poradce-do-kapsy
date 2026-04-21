'use client'

import { ArrowLeft } from 'lucide-react'
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
    setTimeout(onNext, 220)
  }

  return (
    <div className="bg-white rounded-3xl border border-[#E8E9EE] p-6 md:p-8">
      <h2
        className="font-display text-[#162459]"
        style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', letterSpacing: '-0.02em', lineHeight: 1.1 }}
      >
        Rodinná <span style={{ fontStyle: 'italic', color: '#009EE2' }}>situace</span>
      </h2>
      <p className="text-[#818EAF] text-sm mt-2 mb-7">Klikněte na vaši současnou situaci.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {OPTIONS.map((opt) => {
          const active = data.family_status === opt.value
          return (
            <button
              key={opt.value}
              onClick={() => select(opt.value)}
              className={`relative p-5 rounded-2xl text-left transition-all border ${
                active
                  ? 'border-[#009EE2] bg-[#009EE2]/8 shadow-[inset_0_0_0_1px_#009EE2]'
                  : 'border-[#E8E9EE] hover:border-[#009EE2]/50 hover:bg-[#f8f9fc]'
              }`}
            >
              <div className="text-3xl mb-2.5">{opt.icon}</div>
              <div className="font-display text-[#162459]" style={{ fontSize: '1rem', letterSpacing: '-0.01em' }}>
                {opt.label}
              </div>
              <div className="text-xs text-[#818EAF] mt-1">{opt.desc}</div>
            </button>
          )
        })}
      </div>

      <button
        onClick={onBack}
        className="w-full inline-flex items-center justify-center gap-2 py-2.5 border border-[#E8E9EE] text-[#818EAF] hover:text-[#162459] text-sm font-medium rounded-xl hover:bg-[#f8f9fc] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Zpět
      </button>
    </div>
  )
}
