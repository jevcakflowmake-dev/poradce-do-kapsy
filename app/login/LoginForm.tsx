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

  if (magicLinkSent) {
    return (
      <AuthShell
        numeral="↗"
        eyebrow="Odkaz odeslán"
        title={<>Zkontrolujte <span style={{ fontStyle: 'italic', color: '#009EE2' }}>schránku</span>.</>}
        subtitle="Poslali jsme vám přihlašovací odkaz. Klikněte na něj pro přihlášení — link je platný 60 minut."
      >
        <div className="bg-[#FDFCF8] rounded-none border border-[#E4DFD2] p-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-none mb-5 bg-[#009EE2]/10 border border-[#009EE2]/25">
            <Mail className="w-7 h-7 text-[#0079AD]" strokeWidth={1.8} />
          </div>
          <h2
            className="font-display text-[#162459] mb-2"
            style={{ fontSize: '1.4rem', letterSpacing: '-0.01em' }}
          >
            E-mail je na cestě
          </h2>
          <p className="text-sm text-[#66708C] mb-6">
            Pokud zprávu nevidíte do 2 minut, zkuste to znovu nebo zkontrolujte spam.
          </p>
          <button
            onClick={() => { setMagicLinkSent(false); setMagicLink(false) }}
            className="text-sm font-semibold text-[#0079AD] hover:text-[#162459] transition-colors inline-flex items-center gap-1 hover:gap-2"
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
      <div className="bg-[#FDFCF8] rounded-none border border-[#E4DFD2] p-6 md:p-8">
        {error && (
          <div className="mb-4 p-3 bg-[rgba(234,88,12,0.08)] border border-[rgba(234,88,12,0.3)] rounded-none text-sm text-[#c2410c]">
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
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-none font-semibold text-white text-[15px] transition-all disabled:opacity-50 hover:shadow-lg hover:shadow-[#009EE2]/25 hover:-translate-y-0.5"
              style={{ background: '#162459' }}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (<>Přihlásit se <ArrowRight className="w-4 h-4" /></>)}
            </button>
            <div className="flex items-center justify-between mt-1 text-xs">
              <Link href="/forgot-password" className="text-[#66708C] hover:text-[#162459] transition-colors">
                Zapomenuté heslo?
              </Link>
              <button
                type="button"
                onClick={() => { setMagicLink(true); setError(null) }}
                className="text-[#0079AD] hover:text-[#162459] transition-colors font-medium"
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
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-none font-semibold text-white text-[15px] transition-all disabled:opacity-50 hover:shadow-lg hover:shadow-[#009EE2]/25"
              style={{ background: '#162459' }}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Odeslat přihlašovací odkaz'}
            </button>
            <p className="text-center text-xs">
              <button
                type="button"
                onClick={() => { setMagicLink(false); setError(null) }}
                className="text-[#66708C] hover:text-[#162459] transition-colors"
              >
                ← Přihlásit se heslem
              </button>
            </p>
          </form>
        )}
      </div>

      <p className="text-center text-sm text-[#66708C] mt-6">
        Ještě u nás nejste?{' '}
        <Link href="/analyza" className="text-[#0079AD] hover:text-[#162459] font-semibold transition-colors">
          Vyplňte analýzu zdarma
        </Link>
        {' '}— účet zakládat nemusíte.
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
      <label className="block text-xs font-semibold uppercase tracking-[0.15em] text-[#66708C] mb-2">
        {label}
      </label>
      <input
        {...inputProps}
        className="w-full h-11 px-4 rounded-none border border-[#E4DFD2] bg-[#FDFCF8] text-[#162459] text-[15px] placeholder:text-[#66708C] focus:outline-none focus:border-[#009EE2] focus:ring-4 focus:ring-[#009EE2]/10 transition-all"
      />
      {error && <p className="mt-1.5 text-xs text-[#c2410c]">{error}</p>}
    </div>
  )
}
