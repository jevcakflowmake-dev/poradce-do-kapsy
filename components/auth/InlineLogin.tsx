'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const schema = z.object({
  email: z.string().email('Zadejte platný e-mail'),
})

type FormData = z.infer<typeof schema>

export default function InlineLogin() {
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
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
    else setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="text-center py-6">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(255,255,255,0.15)' }}>
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="font-semibold text-white text-lg">Zkontrolujte e-mail</h3>
        <p className="text-blue-200 text-sm mt-2">Poslali jsme vám přihlašovací odkaz. Platí 60 minut.</p>
      </div>
    )
  }

  return (
    <div>
      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-400/30 rounded-xl text-sm text-red-200">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            {...register('email')}
            type="email"
            placeholder="vas@email.cz"
            className="w-full px-4 py-3.5 rounded-xl text-sm bg-white/10 border border-white/20 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-white/40 focus:bg-white/15 transition-all"
          />
          {errors.email && <p className="mt-1 text-xs text-red-300">{errors.email.message}</p>}
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3.5 font-semibold rounded-xl text-sm transition-all disabled:opacity-50 whitespace-nowrap hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #d4a843, #f0c96a)', color: '#0f2d52' }}
        >
          {loading ? 'Odesílám...' : 'Přihlásit se →'}
        </button>
      </form>
      <p className="text-blue-300 text-xs mt-3 opacity-70">
        Nemáte účet?{' '}
        <Link href="/signup" className="underline text-blue-200 hover:text-white transition-colors">
          Začněte dotazníkem zdarma
        </Link>
      </p>
    </div>
  )
}
