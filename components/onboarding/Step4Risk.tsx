'use client'

import { ArrowLeft, Loader2, Check } from 'lucide-react'
import type { OnboardingData } from './OnboardingWizard'
import type { RiskProfile } from '@/lib/types/database'

type Opt = {
  value: RiskProfile
  label: string
  desc: string
  dot: string
  activeBg: string
  activeBorder: string
}

const OPTIONS: Opt[] = [
  {
    value: 'conservative',
    label: 'Konzervativní',
    desc: 'Nechci riskovat, preferuji jistotu i za cenu nižšího výnosu.',
    dot: '#16a34a',
    activeBg: 'rgba(22,163,74,0.08)',
    activeBorder: '#16a34a',
  },
  {
    value: 'moderate',
    label: 'Vyvážený',
    desc: 'Akceptuji mírné výkyvy, chci rozumný výnos.',
    dot: '#009EE2',
    activeBg: 'rgba(0,158,226,0.08)',
    activeBorder: '#009EE2',
  },
  {
    value: 'balanced',
    label: 'Dynamický',
    desc: 'Nevadí mi větší výkyvy, hledám vyšší výnos.',
    dot: '#f59e0b',
    activeBg: 'rgba(245,158,11,0.10)',
    activeBorder: '#f59e0b',
  },
  {
    value: 'aggressive',
    label: 'Agresivní',
    desc: 'Chci maximální výnos, připraven/a i na výrazný pokles.',
    dot: '#ea580c',
    activeBg: 'rgba(234,88,12,0.10)',
    activeBorder: '#ea580c',
  },
]

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
    <div className="bg-white rounded-3xl border border-[#E8E9EE] p-6 md:p-8">
      <h2
        className="font-display text-[#162459]"
        style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', letterSpacing: '-0.02em', lineHeight: 1.1 }}
      >
        Váš vztah k <span style={{ fontStyle: 'italic', color: '#009EE2' }}>riziku</span>
      </h2>
      <p className="text-[#818EAF] text-sm mt-2 mb-7">
        Jak se cítíte ohledně investičního rizika? Odpověď se dá kdykoliv změnit v nastavení profilu.
      </p>

      <div className="space-y-2.5 mb-6">
        {OPTIONS.map((opt) => {
          const selected = data.risk_profile === opt.value
          return (
            <button
              key={opt.value}
              onClick={() => onChange({ risk_profile: opt.value })}
              className="w-full p-4 rounded-2xl text-left transition-all border"
              style={
                selected
                  ? {
                      background: opt.activeBg,
                      borderColor: opt.activeBorder,
                      boxShadow: `inset 0 0 0 1px ${opt.activeBorder}`,
                    }
                  : { borderColor: '#E8E9EE' }
              }
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full" style={{ background: opt.dot }} />
                    <span
                      className="font-display text-[#162459]"
                      style={{ fontSize: '1rem', letterSpacing: '-0.01em' }}
                    >
                      {opt.label}
                    </span>
                  </div>
                  <div className="text-sm text-[#818EAF] mt-1">{opt.desc}</div>
                </div>
                {selected && <Check className="w-5 h-5 shrink-0" style={{ color: opt.activeBorder }} />}
              </div>
            </button>
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
          onClick={onFinish}
          disabled={!data.risk_profile || saving}
          className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white text-[15px] transition-all disabled:opacity-40 hover:shadow-lg hover:shadow-[#009EE2]/25 hover:-translate-y-0.5"
          style={{ background: 'linear-gradient(135deg, #009EE2, #0088c6)' }}
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Dokončit dotazník'}
        </button>
      </div>
    </div>
  )
}
