'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'

/**
 * Přihlášení přímo v závěrečné sekci landingu – pro ty, kdo se vracejí.
 *
 * Registrační záložka tu bývala taky, ale musela pryč ze dvou důvodů:
 * nefungovala (posílala na /api/register formulář bez hesla a pak se snažila
 * přihlásit heslem, které endpoint schválně nevrací), a hlavně odváděla nové
 * návštěvníky od analýzy. Účet bez vyplněné analýzy je pro poradce k ničemu –
 * vstupní branou je proto /analyza a přihlášení řeší až hotový plán.
 */
const loginSchema = z.object({
  email: z.string().email('Zadejte platný e-mail'),
  password: z.string().min(6, 'Heslo musí mít alespoň 6 znaků'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function InlineLogin() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

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

  const inputClass = 'w-full px-4 py-3 rounded-none text-sm bg-white/10 border border-white/20 text-white placeholder-[#F6F4EE]/40 focus:outline-none focus:ring-2 focus:ring-white/40 focus:bg-white/15 transition-all'
  const labelClass = 'block text-xs font-medium text-[#F6F4EE]/70 mb-1.5'
  const errorClass = 'mt-1 text-xs text-red-300'

  return (
    <div>
      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-400/30 rounded-none text-sm text-red-200">
          {error}
        </div>
      )}

      <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-3">
        <div>
          <label className={labelClass}>E-mail</label>
          <input {...loginForm.register('email')} type="email" placeholder="vas@email.cz" autoComplete="email" className={inputClass} />
          {loginForm.formState.errors.email && <p className={errorClass}>{loginForm.formState.errors.email.message}</p>}
        </div>
        <div>
          <label className={labelClass}>Heslo</label>
          <input {...loginForm.register('password')} type="password" placeholder="••••••••" autoComplete="current-password" className={inputClass} />
          {loginForm.formState.errors.password && <p className={errorClass}>{loginForm.formState.errors.password.message}</p>}
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 font-semibold rounded-none text-sm transition-all disabled:opacity-50 hover:opacity-90 mt-1 text-white"
          style={{ background: '#162459' }}
        >
          {loading ? 'Přihlašuji...' : 'Přihlásit se →'}
        </button>
        <p className="text-center mt-2">
          <a href="/forgot-password" className="text-[#F6F4EE]/60 text-xs hover:text-white transition-colors underline">
            Zapomenuté heslo?
          </a>
        </p>
      </form>

      <div className="mt-5 pt-5 border-t border-[#F6F4EE]/10">
        <p className="text-[#F6F4EE]/50 text-xs leading-relaxed text-center">
          Ještě u mě nejste?{' '}
          <Link href="/analyza" className="text-[#009EE2] hover:text-[#1a9fdd] font-semibold transition-colors">
            Vyplňte analýzu
          </Link>
          {' '}– účet zakládat nemusíte, přihlášení řešíme až u hotového plánu.
        </p>
      </div>
    </div>
  )
}
