'use client'

import { useState } from 'react'
import { BARVY } from '@/lib/barvy'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { Mail, Loader2, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import AuthShell from '@/components/auth/AuthShell'
import Field from '@/components/auth/AuthField'

const schema = z.object({
  email: z.string().email('Zadejte platný e-mail'),
  password: z.string().min(6, 'Heslo musí mít alespoň 6 znaků'),
})

const magicLinkSchema = z.object({
  email: z.string().email('Zadejte platný e-mail'),
})

type FormData = z.infer<typeof schema>
type MagicLinkData = z.infer<typeof magicLinkSchema>

/** Hláška podle adresy, ze které člověk na přihlášení přišel. */
export type Upozorneni = 'potvrzeno' | 'odkaz' | null

const UPOZORNENI: Record<Exclude<Upozorneni, null>, { text: string; dobre: boolean }> = {
  potvrzeno: { text: 'E-mail je potvrzený. Přihlaste se heslem, které jste si zvolili.', dobre: true },
  odkaz: {
    text: 'Odkaz už neplatí nebo byl použitý. Nechte si poslat nový – přihlašovacím odkazem, nebo přes Zapomenuté heslo.',
    dobre: false,
  },
}

export default function LoginForm({ upozorneni = null }: { upozorneni?: Upozorneni }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [magicLink, setMagicLink] = useState(false)
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  // E-mail účtu, který se přihlásil správným heslem, ale ještě nepotvrdil adresu.
  const [nepotvrzeny, setNepotvrzeny] = useState<string | null>(null)
  const [znovuOdeslano, setZnovuOdeslano] = useState(false)

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
      // Tuhle chybu Supabase vrací až po správném hesle, nic tedy neprozrazuje.
      if (error.code === 'email_not_confirmed') {
        setNepotvrzeny(data.email.trim().toLowerCase())
        setZnovuOdeslano(false)
      } else {
        setNepotvrzeny(null)
        setError('Nesprávný e-mail nebo heslo')
      }
      setLoading(false)
      return
    }
    const role = authData.user?.app_metadata?.role
    // Tvrdé přesměrování schválně: přihlášením se mění auth cookie a celé
    // načtení je jistota, že serverové komponenty vykreslí novou session.
    // eslint-disable-next-line react-hooks/immutability
    window.location.href = role === 'advisor' ? '/advisor' : '/dashboard'
  }

  async function poslatPotvrzeniZnovu() {
    if (!nepotvrzeny) return
    setLoading(true)
    setError(null)
    const { error } = await createClient().auth.resend({
      type: 'signup',
      email: nepotvrzeny,
      options: { emailRedirectTo: `${window.location.origin}/login?potvrzeno=1` },
    })
    setLoading(false)
    if (error?.status === 429) setError('E-mail jsme poslali před chvílí. Další půjde odeslat za minutu.')
    else if (error) setError('Potvrzovací e-mail se nepodařilo odeslat. Zkuste to prosím později.')
    else setZnovuOdeslano(true)
  }

  async function onMagicLink(data: MagicLinkData) {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email: data.email,
      // Přihlášení účty nezakládá. Bez tohohle Supabase neznámému e-mailu
      // účet rovnou vytvořil a formulář fungoval jako skrytá registrace.
      options: { emailRedirectTo: `${window.location.origin}/auth/callback`, shouldCreateUser: false },
    })
    // Neznámý e-mail (chyba 4xx) se tváří stejně jako známý, jinak by formulář
    // prozradil, kdo je klientem. Přiznáme jen limit pokusů a výpadek odesílání.
    if (error?.status === 429) setError('Příliš mnoho pokusů. Zkuste to prosím za chvíli.')
    else if (error && (error.status ?? 500) >= 500) setError('Odkaz se teď nepodařilo odeslat. Zkuste to později, nebo se přihlaste heslem.')
    else setMagicLinkSent(true)
    setLoading(false)
  }

  if (magicLinkSent) {
    return (
      <AuthShell
        numeral="↗"
        eyebrow="Odkaz odeslán"
        title={<>Zkontrolujte <span style={{ color: BARVY.mint }}>schránku</span>.</>}
        subtitle="Pokud u nás máte účet, poslali jsme vám přihlašovací odkaz. Platí 60 minut."
      >
        <div className="bg-surface rounded-card border border-line p-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-card mb-5 bg-mint/10 border border-mint/25">
            <Mail className="w-7 h-7 text-navy" strokeWidth={1.8} />
          </div>
          <h2
            className="font-display text-navy mb-2 text-h3"
          >
            E-mail je na cestě
          </h2>
          <p className="text-base text-slate mb-6">
            Pokud zprávu nevidíte do 2 minut, zkuste to znovu nebo zkontrolujte spam.
          </p>
          <button
            onClick={() => { setMagicLinkSent(false); setMagicLink(false) }}
            className="text-base font-semibold text-navy hover:text-navy transition-colors inline-flex items-center gap-1 hover:gap-2"
          >
            ← Zpět na přihlášení
          </button>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      eyebrow="Přihlášení · klient nebo poradce"
      title={<>Vítejte <span style={{ color: BARVY.mint }}>zpět</span>.</>}
      subtitle="Přihlaste se k účtu, nebo si nechte poslat odkaz bez hesla. Bez schůzek, bez papírování."
    >
      <div className="bg-surface rounded-card border border-line p-6 md:p-8">
        {upozorneni && !error && !nepotvrzeny && (
          <div
            role="status"
            className={`mb-4 p-3 rounded-card text-base text-pretty ${
              UPOZORNENI[upozorneni].dobre
                ? 'bg-mint/10 border border-mint/30 text-navy'
                : 'bg-danger/10 border border-danger/30 text-danger'
            }`}
          >
            {UPOZORNENI[upozorneni].text}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-danger/10 border border-danger/30 rounded-card text-base text-danger">
            {error}
          </div>
        )}

        {nepotvrzeny && !magicLink && (
          <div role="status" className="mb-4 p-3 bg-amber/15 border border-amber/40 rounded-card text-base text-navy text-pretty">
            {znovuOdeslano ? (
              <>Potvrzovací e-mail jsme znovu poslali na {nepotvrzeny}. Po kliknutí na odkaz se přihlásíte.</>
            ) : (
              <>
                Nejdřív potvrďte e-mail – odkaz jsme vám poslali při registraci.{' '}
                <button
                  type="button"
                  onClick={poslatPotvrzeniZnovu}
                  disabled={loading}
                  className="font-semibold underline underline-offset-4 hover:text-mint-dark rounded-pill disabled:opacity-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40"
                >
                  Poslat ho znovu
                </button>
              </>
            )}
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
              className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-pill bg-navy text-cream text-base font-semibold transition-colors hover:bg-navy-deep disabled:opacity-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40"
             
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (<>Přihlásit se <ArrowRight className="w-4 h-4" /></>)}
            </button>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-1 text-base">
              <Link href="/forgot-password" className="text-slate hover:text-navy transition-colors">
                Zapomenuté heslo?
              </Link>
              <button
                type="button"
                onClick={() => { setMagicLink(true); setError(null) }}
                className="text-navy hover:text-navy transition-colors font-medium"
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
              className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-pill bg-navy text-cream text-base font-semibold transition-colors hover:bg-navy-deep disabled:opacity-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40"
             
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Odeslat přihlašovací odkaz'}
            </button>
            <p className="text-center text-base">
              <button
                type="button"
                onClick={() => { setMagicLink(false); setError(null) }}
                className="text-slate hover:text-navy transition-colors"
              >
                ← Přihlásit se heslem
              </button>
            </p>
          </form>
        )}
      </div>

      <p className="text-center text-base text-slate mt-6">
        Ještě u nás nejste?{' '}
        <Link href="/analyza" className="text-navy hover:text-navy font-semibold transition-colors">
          Vyplňte analýzu zdarma
        </Link>
        {' '}– účet zakládat nemusíte.
      </p>
    </AuthShell>
  )
}

