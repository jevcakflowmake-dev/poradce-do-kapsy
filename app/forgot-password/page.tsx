'use client'

import { useState } from 'react'
import { BARVY } from '@/lib/barvy'
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
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) setError(error.message)
    else setSent(true)
    setLoading(false)
  }

  return (
    <AuthShell
      numeral="–"
      eyebrow="Reset hesla · klidně"
      title={sent
        ? <>Odkaz <span style={{ color: BARVY.mint }}>odeslán</span>.</>
        : <>Nové <span style={{ color: BARVY.mint }}>heslo</span> za minutu.</>
      }
      subtitle={sent
        ? 'Pokud e-mail existuje, najdete v něm odkaz pro reset hesla. Platí 60 minut.'
        : 'Zadejte e-mail, se kterým jste se registrovali. Pošleme odkaz, přes který si nastavíte nové heslo.'
      }
    >
      <div className="bg-surface rounded-card border border-line p-6 md:p-8">
        {sent ? (
          <div className="text-center py-4">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-card mb-5 bg-mint/10 border border-mint/30">
              <CheckCircle2 className="w-7 h-7 text-navy" strokeWidth={1.8} />
            </div>
            <h2
              className="font-display text-navy mb-2 text-h3"
            >
              Zkontrolujte schránku
            </h2>
            <p className="text-base text-slate mb-6">
              Odkaz na reset hesla platí 60 minut. Pokud ho nevidíte, zkontrolujte spam.
            </p>
            <Link
              href="/login"
              className="text-base font-semibold text-navy hover:text-navy transition-colors inline-flex items-center gap-1 hover:gap-2"
            >
              ← Zpět na přihlášení
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 p-3 bg-danger/10 border border-danger/30 rounded-card text-base text-danger">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-base font-medium text-navy mb-2">
                  E-mail
                </label>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="vas@email.cz"
                  autoComplete="email"
                  className="w-full h-11 px-4 rounded-card border border-line bg-surface text-navy text-base placeholder:text-slate focus:outline-none focus:border-mint focus:ring-4 focus:ring-mint/20 transition-all"
                />
                {errors.email && <p className="mt-1.5 text-base text-danger">{errors.email.message}</p>}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-pill bg-navy text-cream text-base font-semibold transition-colors hover:bg-navy-deep disabled:opacity-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40"
               
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Poslat odkaz pro reset'}
              </button>
            </form>
            <p className="text-center text-base text-slate mt-6">
              <Link href="/login" className="hover:text-navy transition-colors">
                ← Zpět na přihlášení
              </Link>
            </p>
          </>
        )}
      </div>
    </AuthShell>
  )
}
