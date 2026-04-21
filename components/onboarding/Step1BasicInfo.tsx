'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowRight } from 'lucide-react'
import type { OnboardingData } from './OnboardingWizard'

const schema = z.object({
  full_name: z.string().min(2, 'Zadejte jméno a příjmení'),
  age: z.string()
    .refine(v => !isNaN(Number(v)) && Number(v) >= 18 && Number(v) <= 80, 'Věk musí být 18–80 let'),
  income: z.string().min(1, 'Vyberte příjmové pásmo'),
})

type FormData = z.infer<typeof schema>

const INCOME_OPTIONS = [
  { value: 'under_20k', label: 'Do 20 000 Kč' },
  { value: '20k_35k', label: '20 000 – 35 000 Kč' },
  { value: '35k_55k', label: '35 000 – 55 000 Kč' },
  { value: '55k_80k', label: '55 000 – 80 000 Kč' },
  { value: 'over_80k', label: 'Nad 80 000 Kč' },
]

export default function Step1BasicInfo({
  data,
  onChange,
  onNext,
}: {
  data: OnboardingData
  onChange: (partial: Partial<OnboardingData>) => void
  onNext: () => void
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { full_name: data.full_name, age: data.age, income: data.income },
  })

  function onSubmit(values: FormData) {
    onChange(values)
    onNext()
  }

  return (
    <div className="bg-white rounded-3xl border border-[#E8E9EE] p-6 md:p-8">
      <h2
        className="font-display text-[#162459]"
        style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', letterSpacing: '-0.02em', lineHeight: 1.1 }}
      >
        Základní <span style={{ fontStyle: 'italic', color: '#009EE2' }}>informace</span>
      </h2>
      <p className="text-[#818EAF] text-sm mt-2 mb-7">Pomůžou nám připravit návrh přesně pro vás.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Field label="Jméno a příjmení" error={errors.full_name?.message}>
          <input
            {...register('full_name')}
            placeholder="Jan Novák"
            autoComplete="name"
            className={inputClass}
          />
        </Field>

        <Field label="Věk" error={errors.age?.message}>
          <input
            {...register('age')}
            type="number"
            min={18}
            max={80}
            placeholder="35"
            className={inputClass}
          />
        </Field>

        <Field label="Čistý měsíční příjem" error={errors.income?.message}>
          <div className="grid grid-cols-1 gap-2">
            {INCOME_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[#E8E9EE] cursor-pointer hover:border-[#009EE2]/50 transition-all has-[:checked]:border-[#009EE2] has-[:checked]:bg-[#009EE2]/8 has-[:checked]:shadow-[inset_0_0_0_1px_#009EE2]"
              >
                <input
                  {...register('income')}
                  type="radio"
                  value={opt.value}
                  className="accent-[#009EE2]"
                />
                <span className="text-sm text-[#162459]">{opt.label}</span>
              </label>
            ))}
          </div>
        </Field>

        <button
          type="submit"
          className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white text-[15px] transition-all hover:shadow-lg hover:shadow-[#009EE2]/25 hover:-translate-y-0.5"
          style={{ background: 'linear-gradient(135deg, #009EE2, #0088c6)' }}
        >
          Pokračovat <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </div>
  )
}

const inputClass =
  'w-full h-11 px-4 rounded-xl border border-[#E8E9EE] bg-white text-[#162459] text-[15px] placeholder:text-[#818EAF] focus:outline-none focus:border-[#009EE2] focus:ring-4 focus:ring-[#009EE2]/10 transition-all'

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-[0.15em] text-[#818EAF] mb-2">
        {label}
      </label>
      {children}
      {error && <p className="mt-1.5 text-xs text-[#c2410c]">{error}</p>}
    </div>
  )
}
