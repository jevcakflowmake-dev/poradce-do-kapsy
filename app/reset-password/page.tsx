'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, ArrowRight, Eye, EyeOff, AlertCircle } from 'lucide-react'
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

type Phase = 'verifying' | 'invalid' | 'ready' | 'saving' | 'done'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>('verifying')
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  // Po příchodu z reset emailu Supabase vrátí buď ?code=… (PKCE) nebo
  // #access_token=…&type=recovery (implicit). Oboje zde rozluštíme a
  // ustavíme session, aby následný updateUser fungoval.
  useEffect(() => {
    const supabase = createClient()
    const url = new URL(window.location.href)
    const code = url.searchParams.get('code')

    async function init() {
      try {
        // 1) Když dorazil PKCE code, exchange ho
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) throw error
          setPhase('ready')
          return
        }

        // 2) Implicit flow — token v hash fragmentu, supabase-js ho v
        // detectSessionInUrl posbírá sám. Vyčkáme na auth state.
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          setPhase('ready')
          return
        }

        // 3) Nic — link je expirovaný / neplatný
        setPhase('invalid')
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Neplatný odkaz'
        setError(msg)
        setPhase('invalid')
      }
    }
    init()
  }, [])

  async function onSubmit(data: FormData) {
    setPhase('saving')
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: data.password })
    if (error) {
      setError(error.message)
      setPhase('ready')
      return
    }
    setPhase('done')
    setTimeout(() => router.push('/dashboard'), 500)
  }

  if (phase === 'verifying') {
    return (
      <AuthShell
        numeral="↻"
        eyebrow="Ověřuji odkaz"
        title={<>Moment.</>}
        subtitle="Ověřuji odkaz z e-mailu — chvíli to potrvá."
      >
        <div className="bg-white rounded-3xl border border-[#E8E9EE] p-10 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#009EE2]" />
        </div>
      </AuthShell>
    )
  }

  if (phase === 'invalid') {
    return (
      <AuthShell
        numeral="✗"
        eyebrow="Odkaz neplatí"
        title={<>Odkaz je <span style={{ fontStyle: 'italic', color: '#009EE2' }}>neplatný</span>.</>}
        subtitle="Reset odkazy platí 60 minut a každý lze použít jen jednou. Pošlu vám nový."
      >
        <div className="bg-white rounded-3xl border border-[#E8E9EE] p-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5 bg-[rgba(234,88,12,0.08)] border border-[rgba(234,88,12,0.25)]">
            <AlertCircle className="w-7 h-7 text-[#c2410c]" strokeWidth={1.8} />
          </div>
          {error && <p className="text-sm text-[#c2410c] mb-4">{error}</p>}
          <Link
            href="/forgot-password"
            className="inline-flex items-center gap-2 px-5 h-11 rounded-xl font-semibold text-white text-sm transition-all hover:shadow-lg hover:shadow-[#009EE2]/25 hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg, #009EE2, #0088c6)' }}
          >
            Vyžádat nový odkaz <ArrowRight className="w-4 h-4" />
          </Link>
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
        {error && phase === 'ready' && (
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
            disabled={phase === 'saving' || phase === 'done'}
            className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white text-[15px] transition-all disabled:opacity-50 hover:shadow-lg hover:shadow-[#009EE2]/25 hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg, #009EE2, #0088c6)' }}
          >
            {phase === 'saving' ? <Loader2 className="w-5 h-5 animate-spin" /> :
             phase === 'done' ? 'Hotovo, přesměrovávám…' :
             (<>Uložit nové heslo <ArrowRight className="w-4 h-4" /></>)}
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
