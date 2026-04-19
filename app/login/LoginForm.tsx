'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'

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
    // Redirect based on role
    const role = authData.user?.user_metadata?.role
    window.location.href = role === 'advisor' ? '/advisor' : '/dashboard'
  }

  async function onMagicLink(data: MagicLinkData) {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email: data.email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-4" style={{ background: 'rgba(0, 158, 226, 0.1)' }}>
              <svg className="w-7 h-7" style={{ color: '#009EE2' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold" style={{ color: '#162459' }}>Zkontrolujte e-mail</h2>
            <p className="text-sm mt-2" style={{ color: '#818EAF' }}>
              Poslali jsme vám přihlašovací odkaz. Klikněte na něj pro přihlášení.
            </p>
            <button
              onClick={() => { setMagicLinkSent(false); setMagicLink(false) }}
              className="text-sm mt-4 underline transition-colors hover:opacity-80"
              style={{ color: '#009EE2' }}
            >
              Zpět na přihlášení
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4" style={{ background: '#162459' }}>
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Přihlášení</h1>
            <p className="text-slate-500 mt-1 text-sm">Poradce do kapsy</p>
          </div>

          {/* Google */}
          <button
            onClick={onGoogle}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-xl text-sm font-medium border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-all disabled:opacity-50 mb-4"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {googleLoading ? 'Přesměrovávám...' : 'Pokračovat přes Google'}
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-slate-400 text-xs">nebo</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Password login */}
          {!magicLink && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">E-mail</label>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="vas@email.cz"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#009EE2]"
                />
                {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Heslo</label>
                <input
                  {...register('password')}
                  type="password"
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#009EE2]"
                />
                {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 font-medium rounded-xl text-white transition-colors disabled:opacity-50 hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #009EE2, #0088c6)' }}
              >
                {loading ? 'Přihlašuji...' : 'Přihlásit se'}
              </button>
              <div className="flex items-center justify-between mt-1">
                <a href="/forgot-password" className="text-slate-400 text-xs hover:text-slate-600 transition-colors underline">
                  Zapomenuté heslo?
                </a>
                <button
                  type="button"
                  onClick={() => { setMagicLink(true); setError(null) }}
                  className="text-xs underline transition-colors hover:opacity-80"
                  style={{ color: '#009EE2' }}
                >
                  Přihlásit se přes magic link
                </button>
              </div>
            </form>
          )}

          {/* Magic link login */}
          {magicLink && (
            <form onSubmit={magicLinkForm.handleSubmit(onMagicLink)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">E-mail</label>
                <input
                  {...magicLinkForm.register('email')}
                  type="email"
                  placeholder="vas@email.cz"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#009EE2]"
                />
                {magicLinkForm.formState.errors.email && <p className="mt-1 text-xs text-red-600">{magicLinkForm.formState.errors.email.message}</p>}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 font-medium rounded-xl text-white transition-colors disabled:opacity-50 hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #009EE2, #0088c6)' }}
              >
                {loading ? 'Odesílám...' : 'Odeslat přihlašovací odkaz'}
              </button>
              <p className="text-center mt-1">
                <button
                  type="button"
                  onClick={() => { setMagicLink(false); setError(null) }}
                  className="text-slate-400 text-xs hover:text-slate-600 transition-colors underline"
                >
                  Přihlásit se heslem
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
