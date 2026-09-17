'use client'

import { useState } from 'react'
import { BARVY } from '@/lib/barvy'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { Loader2, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import AuthShell from '@/components/auth/AuthShell'
import Field from '@/components/auth/AuthField'

const schema = z.object({
  full_name: z.string().min(2, 'Zadejte jméno a příjmení'),
  email: z.string().email('Zadejte platný e-mail'),
  phone: z.string().min(9, 'Zadejte platné telefonní číslo'),
  password: z
    .string()
    .min(8, 'Heslo musí mít alespoň 8 znaků')
    .max(72, 'Maximálně 72 znaků'),
})

type FormData = z.infer<typeof schema>

export default function SignupForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

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
        password: data.password,
      })

      if (loginError) {
        setError('Registrace proběhla, ale automatické přihlášení selhalo. Zkuste se přihlásit ručně.')
        setLoading(false)
        return
      }

      // Tvrdé přesměrování schválně: registrace i přihlášení mění auth cookie
      // a celé načtení je jistota, že server vykreslí stránku s novou session.
      // eslint-disable-next-line react-hooks/immutability, @next/next/no-location-assign-relative-destination
      window.location.href = '/dashboard'
    } catch {
      setError('Chyba připojení. Zkuste to prosím znovu.')
      setLoading(false)
    }
  }

  return (
    <AuthShell
      eyebrow="Registrace · 60 sekund"
      title={<>Začněme <span style={{ color: BARVY.mint }}>bez</span> závazků.</>}
      subtitle="Vyplňte jméno, e-mail, telefon a zvolte si heslo. Přihlášení proběhne automaticky a rovnou uvidíte svůj prostor."
    >
      <div className="bg-surface rounded-card border border-line p-6 md:p-8">
        {error && (
          <div className="mb-4 p-3 bg-danger/10 border border-danger/30 rounded-card text-base text-danger">
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

          <div>
            <label className="block text-base font-medium text-navy mb-2">
              Heslo
            </label>
            <div className="relative">
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="Alespoň 8 znaků"
                autoComplete="new-password"
                className="w-full h-12 px-4 pr-12 rounded-input border border-line bg-surface text-navy text-base placeholder:text-slate focus:outline-none focus:border-mint focus:ring-4 focus:ring-mint/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                aria-label={showPassword ? 'Skrýt heslo' : 'Zobrazit heslo'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate hover:text-navy transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="mt-1.5 text-base text-danger">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-pill bg-navy text-cream text-base font-semibold transition-colors hover:bg-navy-deep disabled:opacity-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40"
           
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (<>Vytvořit účet zdarma <ArrowRight className="w-4 h-4" /></>)}
          </button>
        </form>

        <p className="text-center text-base text-slate mt-5 leading-relaxed">
          Registrací berete na vědomí{' '}
          <Link
            href="/zasady-ochrany-osobnich-udaju"
            className="underline underline-offset-2 hover:text-navy transition-colors"
          >
            zásady zpracování osobních údajů
          </Link>
          .
        </p>
      </div>

      <p className="text-center text-base text-slate mt-6">
        Už máte účet?{' '}
        <Link href="/login" className="text-navy hover:text-navy font-semibold transition-colors">
          Přihlásit se
        </Link>
      </p>
    </AuthShell>
  )
}

