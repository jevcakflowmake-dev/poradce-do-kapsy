'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const magicLinkSchema = z.object({
  email: z.string().email('Zadejte platný e-mail'),
})

const passwordSchema = z.object({
  email: z.string().email('Zadejte platný e-mail'),
  password: z.string().min(6, 'Heslo musí mít alespoň 6 znaků'),
})

type MagicLinkForm = z.infer<typeof magicLinkSchema>
type PasswordForm = z.infer<typeof passwordSchema>

export default function LoginForm() {
  const [mode, setMode] = useState<'magic' | 'password'>('magic')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const magicForm = useForm<MagicLinkForm>({ resolver: zodResolver(magicLinkSchema) })
  const passwordForm = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) })

  async function onMagicLink(data: MagicLinkForm) {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email: data.email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    })
    if (error) setError(error.message)
    else setSent(true)
    setLoading(false)
  }

  async function onPassword(data: PasswordForm) {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword(data)
    if (error) setError('Nesprávný e-mail nebo heslo')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-xl mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Přihlášení</h1>
            <p className="text-slate-500 mt-1 text-sm">Poradce do kapsy</p>
          </div>

          <div className="flex bg-slate-100 rounded-xl p-1 mb-6">
            <button
              onClick={() => setMode('magic')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                mode === 'magic' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              Odkaz na e-mail
            </button>
            <button
              onClick={() => setMode('password')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                mode === 'password' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              Heslo (poradce)
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {mode === 'magic' && !sent && (
            <form onSubmit={magicForm.handleSubmit(onMagicLink)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">E-mail</label>
                <input
                  {...magicForm.register('email')}
                  type="email"
                  placeholder="vas@email.cz"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {magicForm.formState.errors.email && (
                  <p className="mt-1 text-xs text-red-600">{magicForm.formState.errors.email.message}</p>
                )}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
              >
                {loading ? 'Odesílám...' : 'Poslat přihlašovací odkaz'}
              </button>
            </form>
          )}

          {mode === 'magic' && sent && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="font-semibold text-slate-900">Zkontrolujte e-mail</h2>
              <p className="text-sm text-slate-500 mt-2">
                Poslali jsme vám přihlašovací odkaz. Platí 60 minut.
              </p>
            </div>
          )}

          {mode === 'password' && (
            <form onSubmit={passwordForm.handleSubmit(onPassword)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">E-mail</label>
                <input
                  {...passwordForm.register('email')}
                  type="email"
                  placeholder="poradce@email.cz"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {passwordForm.formState.errors.email && (
                  <p className="mt-1 text-xs text-red-600">{passwordForm.formState.errors.email.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Heslo</label>
                <input
                  {...passwordForm.register('password')}
                  type="password"
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {passwordForm.formState.errors.password && (
                  <p className="mt-1 text-xs text-red-600">{passwordForm.formState.errors.password.message}</p>
                )}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
              >
                {loading ? 'Přihlašuji...' : 'Přihlásit se'}
              </button>
            </form>
          )}

          <p className="text-center text-sm text-slate-500 mt-6">
            Nemáte účet?{' '}
            <Link href="/signup" className="text-blue-600 hover:underline font-medium">
              Začít dotazník
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
