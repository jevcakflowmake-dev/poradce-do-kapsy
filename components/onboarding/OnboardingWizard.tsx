'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { FamilyStatus, RiskProfile } from '@/lib/types/database'
import Step1BasicInfo from './Step1BasicInfo'
import Step2Family from './Step2Family'
import Step3Goals from './Step3Goals'
import Step4Risk from './Step4Risk'

export type OnboardingData = {
  full_name: string
  age: string
  income: string
  family_status: FamilyStatus | null
  goals: string[]
  risk_profile: RiskProfile | null
}

const INITIAL: OnboardingData = {
  full_name: '',
  age: '',
  income: '',
  family_status: null,
  goals: [],
  risk_profile: null,
}

const STEPS = ['Základní info', 'Rodinná situace', 'Oblasti zájmu', 'Vztah k riziku']

export default function OnboardingWizard({ userId, initialName }: { userId: string; initialName?: string }) {
  const [step, setStep] = useState(0)
  const [data, setData] = useState<OnboardingData>({ ...INITIAL, full_name: initialName ?? '' })
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null)
  function getSupabase() {
    if (!supabaseRef.current) supabaseRef.current = createClient()
    return supabaseRef.current
  }

  function updateData(partial: Partial<OnboardingData>) {
    setData(prev => ({ ...prev, ...partial }))
  }

  function next() {
    setStep(s => Math.min(s + 1, STEPS.length - 1))
  }

  function prev() {
    setStep(s => Math.max(s - 1, 0))
  }

  async function finish() {
    setSaving(true)
    const { error } = await getSupabase()
      .from('profiles')
      .update({
        full_name: data.full_name,
        age: parseInt(data.age, 10),
        income: data.income,
        family_status: data.family_status,
        goals: data.goals,
        risk_profile: data.risk_profile,
        onboarding_completed: true,
      })
      .eq('id', userId)

    if (!error) {
      router.push('/dashboard')
    }
    setSaving(false)
  }

  const progress = ((step + 1) / STEPS.length) * 100

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-700">Krok {step + 1} z {STEPS.length}</span>
            <span className="text-sm text-slate-500">{STEPS[step]}</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-2">
            {STEPS.map((label, i) => (
              <span
                key={i}
                className={`text-xs ${i <= step ? 'text-blue-600 font-medium' : 'text-slate-400'}`}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center p-4 pt-8">
        <div className="w-full max-w-lg">
          {step === 0 && (
            <Step1BasicInfo data={data} onChange={updateData} onNext={next} />
          )}
          {step === 1 && (
            <Step2Family data={data} onChange={updateData} onNext={next} onBack={prev} />
          )}
          {step === 2 && (
            <Step3Goals data={data} onChange={updateData} onNext={next} onBack={prev} />
          )}
          {step === 3 && (
            <Step4Risk data={data} onChange={updateData} onFinish={finish} onBack={prev} saving={saving} />
          )}
        </div>
      </div>
    </div>
  )
}
