'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { Mail, Loader2, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import AuthShell from '@/components/auth/AuthShell'

const schema = z.object({
  email: z.string().email('Zadejte platný e-mail'),
  password: z.string().min(6, 'Heslo musí mít alespoň 6 znaků'),
})

const magicLinkSchema = z.object({
  email: z.string().email('Zadejte platný e-mail'),
})

type FormData = z.infer<typeof schema>
type MagicLinkData = z.infer<typeof magicLinkSchema>

export default function LoginForm() {
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [magicLink, setMagicLink] = useState(false)
  const [magicLinkSent, setMagicLinkSent] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const magicLinkForm = useForm<MagicLinkData>({
    resolver: zodResolver(magicLinkSchema),
  })

  async function onSubmit(data: FormData) {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { data: authData, error } = await supabase.auth.signInWithPassword(data)
    if (error) {
      setError('Nesprávný e-mail nebo heslo')
      setLoading(false)
      return
    }
    const role = authData.user?.user_metadata?.role
    window.location.href = role === 'advisor' ? '/advisor' : '/dashboard'
  }

  async function onMagicLink(data: MagicLinkData) {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email: data.email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) setError(error.message)
    else setMagicLinkSent(true)
    setLoading(false)
  }

  async function onGoogle() {
    setGoogleLoading(true)
    setError(null)
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    setGoogleLoading(false)
  }

  if (magicLinkSent) {
    return (
      <AuthShell
        numeral="↗"
        eyebrow="Odkaz odeslán"
        title={<>Zkontrolujte <span style={{ fontStyle: 'italic', color: '#009EE2' }}>schránku</span>.</>}
        subtitle="Poslali jsme vám přihlašovací odkaz. Klikněte na něj pro přihlášení — link je platný 60 minut."
      >
        <div className="bg-white rounded-3xl border border-[#E8E9EE] p-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5 bg-[#009EE2]/10 border border-[#009EE2]/25">
            <Mail className="w-7 h-7 text-[#0088c6]" strokeWidth={1.8} />
          </div>
          <h2
            className="font-display text-[#162459] mb-2"
            style={{ fontSize: '1.4rem', letterSpacing: '-0.01em' }}
          >
            E-mail je na cestě
          </h2>
          <p className="text-sm text-[#818EAF] mb-6">
            Pokud zprávu nevidíte do 2 minut, zkuste to znovu nebo zkontrolujte spam.
          </p>
          <button
            onClick={() => { setMagicLinkSent(false); setMagicLink(false) }}
            className="text-sm font-semibold text-[#0088c6] hover:text-[#162459] transition-colors inline-flex items-center gap-1 hover:gap-2"
          >
            ← Zpět na přihlášení
          </button>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      numeral="01"
      eyebrow="Přihlášení · klient nebo poradce"
      title={<>Vítejte <span style={{ fontStyle: 'italic', color: '#009EE2' }}>zpět</span>.</>}
      subtitle="Přihlaste se k účtu, nebo si nechte poslat odkaz bez hesla. Bez schůzek, bez papírování."
    >
      <div className="bg-white rounded-3xl border border-[#E8E9EE] p-6 md:p-8">
        <button
          onClick={onGoogle}
          disabled={googleLoading}
          className="w-full flex items-center justify-center gap-3 py-3 rounded-xl text-sm font-semibold border border-[#E8E9EE] bg-white hover:border-[#009EE2]/50 hover:bg-[#f8f9fc] text-[#162459] transition-all disabled:opacity-50 mb-5"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {googleLoading ? 'Přesměrovávám…' : 'Pokračovat přes Google'}
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-[#E8E9EE]" />
          <span className="text-[#818EAF] text-[11px] tracking-[0.2em] uppercase">nebo</span>
          <div className="flex-1 h-px bg-[#E8E9EE]" />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-[rgba(234,88,12,0.08)] border border-[rgba(234,88,12,0.3)] rounded-xl text-sm text-[#c2410c]">
            {error}
          </div>
        )}

        {!magicLink && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Field
              label="E-mail"
              error={errors.email?.message}
              inputProps={{ ...register('email'), type: 'email', placeholder: 'vas@email.cz', autoComplete: 'email' }}
            />
            <Field
              label="Heslo"
              error={errors.password?.message}
              inputProps={{ ...register('password'), type: 'password', placeholder: '••••••••', autoComplete: 'current-password' }}
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white text-[15px] transition-all disabled:opacity-50 hover:shadow-lg hover:shadow-[#009EE2]/25 hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #009EE2, #0088c6)' }}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (<>Přihlásit se <ArrowRight className="w-4 h-4" /></>)}
            </button>
            <div className="flex items-center justify-between mt-1 text-xs">
              <Link href="/forgot-password" className="text-[#818EAF] hover:text-[#162459] transition-colors">
                Zapomenuté heslo?
              </Link>
              <button
                type="button"
                onClick={() => { setMagicLink(true); setError(null) }}
                className="text-[#0088c6] hover:text-[#162459] transition-colors font-medium"
              >
                Přihlásit odkazem v e-mailu →
              </button>
            </div>
          </form>
        )}

        {magicLink && (
          <form onSubmit={magicLinkForm.handleSubmit(onMagicLink)} className="space-y-4">
            <Field
              label="E-mail"
              error={magicLinkForm.formState.errors.email?.message}
              inputProps={{ ...magicLinkForm.register('email'), type: 'email', placeholder: 'vas@email.cz', autoComplete: 'email' }}
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white text-[15px] transition-all disabled:opacity-50 hover:shadow-lg hover:shadow-[#009EE2]/25"
              style={{ background: 'linear-gradient(135deg, #009EE2, #0088c6)' }}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Odeslat přihlašovací odkaz'}
            </button>
            <p className="text-center text-xs">
              <button
                type="button"
                onClick={() => { setMagicLink(false); setError(null) }}
                className="text-[#818EAF] hover:text-[#162459] transition-colors"
              >
                ← Přihlásit se heslem
              </button>
            </p>
          </form>
        )}
      </div>

      <p className="text-center text-sm text-[#818EAF] mt-6">
        Ještě nemáte účet?{' '}
        <Link href="/signup" className="text-[#0088c6] hover:text-[#162459] font-semibold transition-colors">
          Vytvořit účet zdarma
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
