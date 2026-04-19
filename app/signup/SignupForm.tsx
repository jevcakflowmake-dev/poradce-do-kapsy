'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const schema = z.object({
  full_name: z.string().min(2, 'Zadejte jméno a příjmení'),
  email: z.string().email('Zadejte platný e-mail'),
  phone: z.string().min(9, 'Zadejte platné telefonní číslo'),
})

type FormData = z.infer<typeof schema>

export default function SignupForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await res.json()

      if (!res.ok) {
        setError(result.error || 'Něco se pokazilo')
        setLoading(false)
        return
      }

      if (result.exists) {
        // User already exists — redirect to login
        setError('Účet s tímto e-mailem již existuje. Přihlaste se.')
        setLoading(false)
        return
      }

      // Auto-login with the temporary password
      const supabase = createClient()
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: data.email.trim().toLowerCase(),
        password: result.password,
      })

      if (loginError) {
        setError('Registrace proběhla, ale automatické přihlášení selhalo. Zkuste se přihlásit ručně.')
        setLoading(false)
        return
      }

      // Redirect to dashboard
      router.push('/dashboard')
    } catch {
      setError('Chyba připojení. Zkuste to prosím znovu.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 bg-gradient-to-br from-[#162459] to-[#243471]">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold" style={{ color: '#162459' }}>Začít zdarma</h1>
            <p className="mt-1 text-sm" style={{ color: '#818EAF' }}>Vyplňte údaje a dostanete přístup k portálu</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#162459' }}>Jméno a příjmení</label>
              <input
                {...register('full_name')}
                type="text"
                placeholder="Jan Novák"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#009EE2]"
              />
              {errors.full_name && <p className="mt-1 text-xs text-red-600">{errors.full_name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#162459' }}>E-mail</label>
              <input
                {...register('email')}
                type="email"
                placeholder="vas@email.cz"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#009EE2]"
              />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#162459' }}>Telefon</label>
              <input
                {...register('phone')}
                type="tel"
                placeholder="+420 123 456 789"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#009EE2]"
              />
              {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 font-medium rounded-xl text-white transition-colors disabled:opacity-50 hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #009EE2, #0088c6)' }}
            >
              {loading ? 'Odesílám...' : 'Registrovat se →'}
            </button>
          </form>

          <p className="text-center text-xs mt-4" style={{ color: '#818EAF' }}>
            Registrací souhlasíte se zpracováním osobních údajů
          </p>
        </div>
      </div>
    </div>
  )
}
