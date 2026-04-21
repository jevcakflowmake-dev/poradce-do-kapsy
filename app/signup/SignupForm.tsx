'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { Loader2, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import AuthShell from '@/components/auth/AuthShell'

const schema = z.object({
  full_name: z.string().min(2, 'Zadejte jméno a příjmení'),
  email: z.string().email('Zadejte platný e-mail'),
  phone: z.string().min(9, 'Zadejte platné telefonní číslo'),
})

type FormData = z.infer<typeof schema>

export default function SignupForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
        setError('Účet s tímto e-mailem už existuje. Přihlaste se.')
        setLoading(false)
        return
      }

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

      window.location.href = '/dashboard'
    } catch {
      setError('Chyba připojení. Zkuste to prosím znovu.')
      setLoading(false)
    }
  }

  return (
    <AuthShell
      numeral="02"
      eyebrow="Registrace · 60 sekund"
      title={<>Začněme <span style={{ fontStyle: 'italic', color: '#009EE2' }}>bez</span> závazků.</>}
      subtitle="Vyplňte jméno, e-mail a telefon. Přihlášení proběhne automaticky a rovnou uvidíte svůj prostor."
    >
      <div className="bg-white rounded-3xl border border-[#E8E9EE] p-6 md:p-8">
        {error && (
          <div className="mb-4 p-3 bg-[rgba(234,88,12,0.08)] border border-[rgba(234,88,12,0.3)] rounded-xl text-sm text-[#c2410c]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field
            label="Jméno a příjmení"
            error={errors.full_name?.message}
            inputProps={{ ...register('full_name'), type: 'text', placeholder: 'Jan Novák', autoComplete: 'name' }}
          />
          <Field
            label="E-mail"
            error={errors.email?.message}
            inputProps={{ ...register('email'), type: 'email', placeholder: 'vas@email.cz', autoComplete: 'email' }}
          />
          <Field
            label="Telefon"
            error={errors.phone?.message}
            inputProps={{ ...register('phone'), type: 'tel', placeholder: '+420 123 456 789', autoComplete: 'tel' }}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white text-[15px] transition-all disabled:opacity-50 hover:shadow-lg hover:shadow-[#009EE2]/25 hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg, #009EE2, #0088c6)' }}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (<>Vytvořit účet zdarma <ArrowRight className="w-4 h-4" /></>)}
          </button>
        </form>

        <p className="text-center text-xs text-[#818EAF] mt-5">
          Registrací souhlasíte se zpracováním osobních údajů.
        </p>
      </div>

      <p className="text-center text-sm text-[#818EAF] mt-6">
        Už máte účet?{' '}
        <Link href="/login" className="text-[#0088c6] hover:text-[#162459] font-semibold transition-colors">
          Přihlásit se
        </Link>
      </p>
    </AuthShell>
  )
}

function Field({
  label,
  error,
  inputProps,
}: {
  label: string
  error?: string
  inputProps: React.InputHTMLAttributes<HTMLInputElement>
}) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-[0.15em] text-[#818EAF] mb-2">
        {label}
      </label>
      <input
        {...inputProps}
        className="w-full h-11 px-4 rounded-xl border border-[#E8E9EE] bg-white text-[#162459] text-[15px] placeholder:text-[#818EAF] focus:outline-none focus:border-[#009EE2] focus:ring-4 focus:ring-[#009EE2]/10 transition-all"
      />
      {error && <p className="mt-1.5 text-xs text-[#c2410c]">{error}</p>}
    </div>
  )
}
