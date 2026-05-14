'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { Loader2, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import AuthShell from '@/components/auth/AuthShell'

const schema = z
  .object({
    password: z
      .string()
      .min(8, 'Heslo musí mít alespoň 8 znaků')
      .max(72, 'Maximálně 72 znaků'),
    confirm_password: z.string(),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: 'Hesla se neshodují',
    path: ['confirm_password'],
  })

type FormData = z.infer<typeof schema>

export default function UpdatePasswordPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  // Bez aktivní session (z reset-password emailu by ji měl ustavit /auth/callback)
  // nemá smysl form zobrazovat — pošleme uživatele zpět na žádost o reset.
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace('/forgot-password?error=expired')
        return
      }
      setCheckingSession(false)
    })
  }, [router])

  async function onSubmit(data: FormData) {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: data.password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  if (checkingSession) {
    return (
      <AuthShell numeral="↻" eyebrow="Načítám…" title={<>Moment.</>} subtitle="Ověřuji odkaz z e-mailu.">
        <div className="bg-white rounded-3xl border border-[#E8E9EE] p-10 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#009EE2]" />
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      numeral="↻"
      eyebrow="Nové heslo · poslední krok"
      title={<>Nastavte si <span style={{ fontStyle: 'italic', color: '#009EE2' }}>nové</span> heslo.</>}
      subtitle="Zadejte heslo aspoň 8 znaků. Po uložení vás přesměrujeme do vašeho prostoru."
    >
      <div className="bg-white rounded-3xl border border-[#E8E9EE] p-6 md:p-8">
        {error && (
          <div className="mb-4 p-3 bg-[rgba(234,88,12,0.08)] border border-[rgba(234,88,12,0.3)] rounded-xl text-sm text-[#c2410c]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <PasswordField
            label="Nové heslo"
            error={errors.password?.message}
            register={register('password')}
            show={showPassword}
            onToggle={() => setShowPassword((v) => !v)}
          />
          <PasswordField
            label="Potvrzení hesla"
            error={errors.confirm_password?.message}
            register={register('confirm_password')}
            show={showPassword}
            onToggle={() => setShowPassword((v) => !v)}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white text-[15px] transition-all disabled:opacity-50 hover:shadow-lg hover:shadow-[#009EE2]/25 hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg, #009EE2, #0088c6)' }}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (<>Uložit nové heslo <ArrowRight className="w-4 h-4" /></>)}
          </button>
        </form>
      </div>
    </AuthShell>
  )
}

function PasswordField({
  label,
  error,
  register,
  show,
  onToggle,
}: {
  label: string
  error?: string
  register: ReturnType<ReturnType<typeof useForm<FormData>>['register']>
  show: boolean
  onToggle: () => void
}) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-[0.15em] text-[#818EAF] mb-2">
        {label}
      </label>
      <div className="relative">
        <input
          {...register}
          type={show ? 'text' : 'password'}
          placeholder="••••••••"
          autoComplete="new-password"
          className="w-full h-11 px-4 pr-11 rounded-xl border border-[#E8E9EE] bg-white text-[#162459] text-[15px] placeholder:text-[#818EAF] focus:outline-none focus:border-[#009EE2] focus:ring-4 focus:ring-[#009EE2]/10 transition-all"
        />
        <button
          type="button"
          onClick={onToggle}
          tabIndex={-1}
          aria-label={show ? 'Skrýt heslo' : 'Zobrazit heslo'}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#818EAF] hover:text-[#162459] transition-colors"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {error && <p className="mt-1.5 text-xs text-[#c2410c]">{error}</p>}
    </div>
  )
}
