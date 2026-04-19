'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'

const loginSchema = z.object({
  email: z.string().email('Zadejte platný e-mail'),
  password: z.string().min(6, 'Heslo musí mít alespoň 6 znaků'),
})

const magicLinkSchema = z.object({
  email: z.string().email('Zadejte platný e-mail'),
})

const registerSchema = z.object({
  full_name: z.string().min(2, 'Zadejte jméno a příjmení'),
  email: z.string().email('Zadejte platný e-mail'),
  phone: z.string().min(9, 'Zadejte platné telefonní číslo'),
  password: z.string().min(6, 'Heslo musí mít alespoň 6 znaků'),
  confirm_password: z.string(),
}).refine((d) => d.password === d.confirm_password, {
  message: 'Hesla se neshodují',
  path: ['confirm_password'],
})

type LoginForm = z.infer<typeof loginSchema>
type MagicLinkForm = z.infer<typeof magicLinkSchema>
type RegisterForm = z.infer<typeof registerSchema>

export default function InlineLogin() {
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [loginMode, setLoginMode] = useState<'password' | 'magiclink'>('password')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [registered, setRegistered] = useState(false)
  const [magicLinkSent, setMagicLinkSent] = useState(false)

  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })
  const magicLinkForm = useForm<MagicLinkForm>({ resolver: zodResolver(magicLinkSchema) })
  const registerForm = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) })

  async function onLogin(data: LoginForm) {
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

  async function onMagicLink(data: MagicLinkForm) {
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

  async function onRegister(data: RegisterForm) {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
        data: { full_name: data.full_name, phone: data.phone, role: 'client' },
      },
    })
    if (error) setError(error.message)
    else setRegistered(true)
    setLoading(false)
  }

  async function onGoogle() {
    setGoogleLoading(true)
    setError(null)
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    setGoogleLoading(false)
  }

  const inputClass = 'w-full px-4 py-3 rounded-xl text-sm bg-white/10 border border-white/20 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-white/40 focus:bg-white/15 transition-all'
  const labelClass = 'block text-xs font-medium text-blue-200 mb-1.5'
  const errorClass = 'mt-1 text-xs text-red-300'

  if (registered) {
    return (
      <div className="text-center py-6">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(255,255,255,0.15)' }}>
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="font-semibold text-white text-lg">Zkontrolujte e-mail</h3>
        <p className="text-blue-200 text-sm mt-2">Poslali jsme vám potvrzovací odkaz. Po kliknutí začnete dotazník.</p>
      </div>
    )
  }

  if (magicLinkSent) {
    return (
      <div className="text-center py-6">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(255,255,255,0.15)' }}>
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="font-semibold text-white text-lg">Zkontrolujte e-mail</h3>
        <p className="text-blue-200 text-sm mt-2">Poslali jsme vám přihlašovací odkaz. Klikněte na něj pro přihlášení.</p>
        <button
          onClick={() => { setMagicLinkSent(false); setLoginMode('password') }}
          className="text-blue-300 text-xs mt-4 hover:text-white transition-colors underline"
        >
          Zpět na přihlášení
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* Tab přepínač */}
      <div className="flex bg-white/10 rounded-xl p-1 mb-5">
        <button
          onClick={() => { setTab('login'); setError(null); setLoginMode('password') }}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
            tab === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-blue-200 hover:text-white'
          }`}
        >
          Přihlásit se
        </button>
        <button
          onClick={() => { setTab('register'); setError(null) }}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
            tab === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-blue-200 hover:text-white'
          }`}
        >
          Registrovat se
        </button>
      </div>

      {/* Google tlačítko */}
      <button
        onClick={onGoogle}
        disabled={googleLoading}
        className="w-full flex items-center justify-center gap-3 py-3 rounded-xl text-sm font-medium bg-white text-slate-700 hover:bg-slate-50 transition-all disabled:opacity-50 mb-4"
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
        <div className="flex-1 h-px bg-white/20" />
        <span className="text-blue-300 text-xs">nebo</span>
        <div className="flex-1 h-px bg-white/20" />
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-400/30 rounded-xl text-sm text-red-200">
          {error}
        </div>
      )}

      {/* Přihlášení */}
      {tab === 'login' && loginMode === 'password' && (
        <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-3">
          <div>
            <label className={labelClass}>E-mail</label>
            <input {...loginForm.register('email')} type="email" placeholder="vas@email.cz" className={inputClass} />
            {loginForm.formState.errors.email && <p className={errorClass}>{loginForm.formState.errors.email.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Heslo</label>
            <input {...loginForm.register('password')} type="password" placeholder="••••••••" className={inputClass} />
            {loginForm.formState.errors.password && <p className={errorClass}>{loginForm.formState.errors.password.message}</p>}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 font-semibold rounded-xl text-sm transition-all disabled:opacity-50 hover:opacity-90 mt-1"
            style={{ background: 'linear-gradient(135deg, #009EE2, #0088c6)', color: '#fff' }}
          >
            {loading ? 'Přihlašuji...' : 'Přihlásit se →'}
          </button>
          <div className="flex items-center justify-between mt-2">
            <a href="/forgot-password" className="text-blue-300 text-xs hover:text-white transition-colors underline">
              Zapomenuté heslo?
            </a>
            <button
              type="button"
              onClick={() => setLoginMode('magiclink')}
              className="text-blue-300 text-xs hover:text-white transition-colors underline"
            >
              Přihlásit se přes magic link
            </button>
          </div>
        </form>
      )}

      {/* Magic link přihlášení */}
      {tab === 'login' && loginMode === 'magiclink' && (
        <form onSubmit={magicLinkForm.handleSubmit(onMagicLink)} className="space-y-3">
          <div>
            <label className={labelClass}>E-mail</label>
            <input {...magicLinkForm.register('email')} type="email" placeholder="vas@email.cz" className={inputClass} />
            {magicLinkForm.formState.errors.email && <p className={errorClass}>{magicLinkForm.formState.errors.email.message}</p>}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 font-semibold rounded-xl text-sm transition-all disabled:opacity-50 hover:opacity-90 mt-1"
            style={{ background: 'linear-gradient(135deg, #009EE2, #0088c6)', color: '#fff' }}
          >
            {loading ? 'Odesílám...' : 'Odeslat přihlašovací odkaz →'}
          </button>
          <p className="text-center mt-2">
            <button
              type="button"
              onClick={() => setLoginMode('password')}
              className="text-blue-300 text-xs hover:text-white transition-colors underline"
            >
              Přihlásit se heslem
            </button>
          </p>
        </form>
      )}

      {/* Registrace */}
      {tab === 'register' && (
        <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-3">
          <div>
            <label className={labelClass}>Jméno a příjmení</label>
            <input {...registerForm.register('full_name')} type="text" placeholder="Jan Novák" className={inputClass} />
            {registerForm.formState.errors.full_name && <p className={errorClass}>{registerForm.formState.errors.full_name.message}</p>}
          </div>
          <div>
            <label className={labelClass}>E-mail</label>
            <input {...registerForm.register('email')} type="email" placeholder="vas@email.cz" className={inputClass} />
            {registerForm.formState.errors.email && <p className={errorClass}>{registerForm.formState.errors.email.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Telefon</label>
            <input {...registerForm.register('phone')} type="tel" placeholder="+420 123 456 789" className={inputClass} />
            {registerForm.formState.errors.phone && <p className={errorClass}>{registerForm.formState.errors.phone.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Heslo</label>
            <input {...registerForm.register('password')} type="password" placeholder="••••••••" className={inputClass} />
            {registerForm.formState.errors.password && <p className={errorClass}>{registerForm.formState.errors.password.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Potvrzení hesla</label>
            <input {...registerForm.register('confirm_password')} type="password" placeholder="••••••••" className={inputClass} />
            {registerForm.formState.errors.confirm_password && <p className={errorClass}>{registerForm.formState.errors.confirm_password.message}</p>}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 font-semibold rounded-xl text-sm transition-all disabled:opacity-50 hover:opacity-90 mt-1"
            style={{ background: 'linear-gradient(135deg, #009EE2, #0088c6)', color: '#fff' }}
          >
            {loading ? 'Registruji...' : 'Vytvořit účet →'}
          </button>
          <p className="text-blue-300 text-xs opacity-70 text-center">
            Registrací souhlasíte se zpracováním osobních údajů
          </p>
        </form>
      )}
    </div>
  )
}
