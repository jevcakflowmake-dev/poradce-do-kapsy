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

const registerSchema = z.object({
  full_name: z.string().min(2, 'Zadejte jméno a příjmení'),
  email: z.string().email('Zadejte platný e-mail'),
  phone: z.string().min(9, 'Zadejte platné telefonní číslo'),
})

type LoginForm = z.infer<typeof loginSchema>
type RegisterForm = z.infer<typeof registerSchema>

export default function InlineLogin() {
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })
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

  async function onRegister(data: RegisterForm) {
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
        setError('Účet s tímto e-mailem již existuje. Přihlaste se.')
        setLoading(false)
        return
      }

      // Auto-login
      const supabase = createClient()
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: data.email.trim().toLowerCase(),
        password: result.password,
      })

      if (loginError) {
        setError('Registrace proběhla, ale přihlášení selhalo. Zkuste se přihlásit ručně.')
        setLoading(false)
        return
      }

      window.location.href = '/dashboard'
    } catch {
      setError('Chyba připojení. Zkuste to prosím znovu.')
      setLoading(false)
    }
  }

  const inputClass = 'w-full px-4 py-3 rounded-xl text-sm bg-white/10 border border-white/20 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-white/40 focus:bg-white/15 transition-all'
  const labelClass = 'block text-xs font-medium text-blue-200 mb-1.5'
  const errorClass = 'mt-1 text-xs text-red-300'

  return (
    <div>
      {/* Tab přepínač */}
      <div className="flex bg-white/10 rounded-xl p-1 mb-5">
        <button
          onClick={() => { setTab('login'); setError(null) }}
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

      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-400/30 rounded-xl text-sm text-red-200">
          {error}
        </div>
      )}

      {/* Přihlášení */}
      {tab === 'login' && (
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
            className="w-full py-3.5 font-semibold rounded-xl text-sm transition-all disabled:opacity-50 hover:opacity-90 mt-1 text-white"
            style={{ background: 'linear-gradient(135deg, #009EE2, #0088c6)' }}
          >
            {loading ? 'Přihlašuji...' : 'Přihlásit se →'}
          </button>
          <p className="text-center mt-2">
            <a href="/forgot-password" className="text-blue-300 text-xs hover:text-white transition-colors underline">
              Zapomenuté heslo?
            </a>
          </p>
        </form>
      )}

      {/* Registrace — jen jméno, email, telefon */}
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
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 font-semibold rounded-xl text-sm transition-all disabled:opacity-50 hover:opacity-90 mt-1 text-white"
            style={{ background: 'linear-gradient(135deg, #009EE2, #0088c6)' }}
          >
            {loading ? 'Registruji...' : 'Registrovat se →'}
          </button>
          <p className="text-blue-300 text-xs opacity-70 text-center">
            Registrací souhlasíte se zpracováním osobních údajů
          </p>
        </form>
      )}
    </div>
  )
}
