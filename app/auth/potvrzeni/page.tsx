import Link from 'next/link'
import type { ReactNode } from 'react'
import { ShieldCheck } from 'lucide-react'
import AuthShell from '@/components/auth/AuthShell'
import { BARVY } from '@/lib/barvy'

/**
 * Mezistránka pro odkazy z e-mailů (šablony v supabase/templates).
 *
 * Odkaz z e-mailu token sám neověřuje – to dělá až tlačítko, které odešle
 * formulář na /auth/confirm. Skenery pošty (Microsoft Safe Links a spol.)
 * odkazy otevírají předem, a kdyby stránka ověřovala hned, jednorázový
 * token by spotřebovaly a klient by po kliknutí viděl „odkaz neplatí“.
 * Tlačítko žádný skener nemačká.
 */

type Texty = { eyebrow: string; title: ReactNode; subtitle: string; tlacitko: string }

const zvyrazni = (text: string) => <span style={{ color: BARVY.mint }}>{text}</span>

const TEXTY: Record<string, Texty> = {
  registrace: {
    eyebrow: 'Potvrzení e-mailu',
    title: <>Ještě jedno {zvyrazni('kliknutí')}.</>,
    subtitle: 'Potvrďte e-mail a rovnou vás přihlásíme.',
    tlacitko: 'Potvrdit e-mail',
  },
  prihlaseni: {
    eyebrow: 'Přihlášení',
    title: <>Přihlášení {zvyrazni('bez hesla')}.</>,
    subtitle: 'Pokračujte tlačítkem a jste ve svém účtu.',
    tlacitko: 'Přihlásit se',
  },
  recovery: {
    eyebrow: 'Nastavení hesla',
    title: <>Nastavte si {zvyrazni('heslo')}.</>,
    subtitle: 'Po kliknutí si zvolíte heslo, se kterým se budete přihlašovat.',
    tlacitko: 'Pokračovat k nastavení hesla',
  },
  invite: {
    eyebrow: 'Přístup do aplikace',
    title: <>Máte připravený {zvyrazni('přístup')}.</>,
    subtitle: 'Po kliknutí si nastavíte heslo a uvidíte svůj finanční plán.',
    tlacitko: 'Nastavit heslo',
  },
  email_change: {
    eyebrow: 'Změna e-mailu',
    title: <>Potvrďte {zvyrazni('nový e-mail')}.</>,
    subtitle: 'Změna začne platit po potvrzení.',
    tlacitko: 'Potvrdit změnu',
  },
}

const TYPY = ['email', 'recovery', 'invite', 'email_change', 'signup', 'magiclink']

export default async function PotvrzeniPage({
  searchParams,
}: {
  searchParams: Promise<{ token_hash?: string; type?: string; ucel?: string; next?: string }>
}) {
  const { token_hash: tokenHash, type, ucel, next } = await searchParams

  if (!tokenHash || !type || !TYPY.includes(type)) {
    return (
      <AuthShell
        numeral="✗"
        eyebrow="Odkaz neplatí"
        title={<>Odkaz je {zvyrazni('neúplný')}.</>}
        subtitle="Otevřete ho prosím přímo z e-mailu, nebo si na přihlašovací stránce nechte poslat nový."
      >
        <div className="bg-surface rounded-card border border-line p-6 md:p-8 text-center">
          <Link
            href="/login"
            className="text-base font-semibold text-navy underline underline-offset-4 hover:text-mint-dark rounded-pill focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40"
          >
            Přejít na přihlášení
          </Link>
        </div>
      </AuthShell>
    )
  }

  const texty = TEXTY[type] ?? TEXTY[ucel === 'registrace' ? 'registrace' : 'prihlaseni']

  return (
    <AuthShell eyebrow={texty.eyebrow} title={texty.title} subtitle={texty.subtitle}>
      <div className="bg-surface rounded-card border border-line p-6 md:p-8">
        <form method="post" action="/auth/confirm">
          <input type="hidden" name="token_hash" value={tokenHash} />
          <input type="hidden" name="type" value={type} />
          {next && <input type="hidden" name="next" value={next} />}
          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-pill bg-navy text-cream text-base font-semibold transition-colors hover:bg-navy-deep focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40"
          >
            {texty.tlacitko}
          </button>
        </form>
        <p className="mt-5 flex gap-2.5 text-base text-slate text-pretty">
          <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5 text-navy" strokeWidth={1.8} aria-hidden />
          Tlačítko je tu kvůli bezpečnosti. Chrání odkaz před programy, které poštu kontrolují
          a otevírají odkazy za vás.
        </p>
      </div>
    </AuthShell>
  )
}
