'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import AuthShell from '@/components/auth/AuthShell'

const schema = z.object({
  email: z.string().email('Zadejte platný e-mail'),
})

type FormData = z.infer<typeof schema>

export default function ForgotPasswordPage() {
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
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
    })
    if (error) setError(error.message)
    else setSent(true)
    setLoading(false)
  }

  return (
    <AuthShell
      numeral="—"
      eyebrow="Reset hesla · klidně"
      title={sent
        ? <>Odkaz <span style={{ fontStyle: 'italic', color: '#009EE2' }}>odeslán</span>.</>
        : <>Nové <span style={{ fontStyle: 'italic', color: '#009EE2' }}>heslo</span> za minutu.</>
      }
      subtitle={sent
        ? 'Pokud e-mail existuje, najdete v něm odkaz pro reset hesla. Platí 60 minut.'
        : 'Zadejte e-mail, se kterým jste se registrovali. Pošleme odkaz, přes který si nastavíte nové heslo.'
      }
    >
      <div className="bg-white rounded-3xl border border-[#E8E9EE] p-6 md:p-8">
        {sent ? (
          <div className="text-center py-4">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5 bg-[#16a34a]/10 border border-[#16a34a]/25">
              <CheckCircle2 className="w-7 h-7 text-[#15803d]" strokeWidth={1.8} />
            </div>
            <h2
              className="font-display text-[#162459] mb-2"
              style={{ fontSize: '1.4rem', letterSpacing: '-0.01em' }}
            >
              Zkontrolujte schránku
            </h2>
            <p className="text-sm text-[#818EAF] mb-6">
              Odkaz na reset hesla platí 60 minut. Pokud ho nevidíte, zkontrolujte spam.
            </p>
            <Link
              href="/login"
              className="text-sm font-semibold text-[#0088c6] hover:text-[#162459] transition-colors inline-flex items-center gap-1 hover:gap-2"
            >
              ← Zpět na přihlášení
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 p-3 bg-[rgba(234,88,12,0.08)] border border-[rgba(234,88,12,0.3)] rounded-xl text-sm text-[#c2410c]">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.15em] text-[#818EAF] mb-2">
                  E-mail
                </label>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="vas@email.cz"
                  autoComplete="email"
                  className="w-full h-11 px-4 rounded-xl border border-[#E8E9EE] bg-white text-[#162459] text-[15px] placeholder:text-[#818EAF] focus:outline-none focus:border-[#009EE2] focus:ring-4 focus:ring-[#009EE2]/10 transition-all"
                />
                {errors.email && <p className="mt-1.5 text-xs text-[#c2410c]">{errors.email.message}</p>}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white text-[15px] transition-all disabled:opacity-50 hover:shadow-lg hover:shadow-[#009EE2]/25 hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg, #009EE2, #0088c6)' }}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Poslat odkaz pro reset'}
              </button>
            </form>
            <p className="text-center text-sm text-[#818EAF] mt-6">
              <Link href="/login" className="hover:text-[#162459] transition-colors">
                ← Zpět na přihlášení
              </Link>
            </p>
          </>
        )}
      </div>
    </AuthShell>
  )
}
