'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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
    defaultValues: {
      full_name: data.full_name,
      age: data.age,
      income: data.income,
    },
  })

  function onSubmit(values: FormData) {
    onChange(values)
    onNext()
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
      <h2 className="text-xl font-bold text-slate-900 mb-1">Základní informace</h2>
      <p className="text-slate-500 text-sm mb-6">Pomůžou nám připravit návrh přesně pro vás</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Jméno a příjmení</label>
          <input
            {...register('full_name')}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Jan Novák"
          />
          {errors.full_name && <p className="mt-1 text-xs text-red-600">{errors.full_name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Věk</label>
          <input
            {...register('age')}
            type="number"
            min={18}
            max={80}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="35"
          />
          {errors.age && <p className="mt-1 text-xs text-red-600">{errors.age.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Čistý měsíční příjem</label>
          <div className="grid grid-cols-1 gap-2">
            {INCOME_OPTIONS.map(opt => (
              <label key={opt.value} className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:border-blue-300 transition-colors has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50">
                <input
                  {...register('income')}
                  type="radio"
                  value={opt.value}
                  className="accent-blue-600"
                />
                <span className="text-sm text-slate-700">{opt.label}</span>
              </label>
            ))}
          </div>
          {errors.income && <p className="mt-1 text-xs text-red-600">{errors.income.message}</p>}
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
        >
          Pokračovat
        </button>
      </form>
    </div>
  )
}
