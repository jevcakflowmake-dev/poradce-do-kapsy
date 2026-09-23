import { NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { bezpecnyCil } from '@/lib/presmerovani'

/**
 * Ověření odkazu z e-mailu. Sem posílá formulář z mezistránky
 * /auth/potvrzeni – schválně POST po kliknutí na tlačítko, ne GET rovnou
 * z e-mailu: skenery pošty (Microsoft Safe Links a spol.) odkazy předem
 * otevírají a jednorázový token by spotřebovaly dřív než člověk.
 *
 * `token_hash` se ověřuje tady na serveru, takže odkaz funguje i na jiném
 * zařízení, než kde si o něj klient řekl – na rozdíl od `?code=` (PKCE),
 * který potřebuje klíč uložený v původním prohlížeči.
 */
const TYPY: readonly EmailOtpType[] = ['email', 'recovery', 'invite', 'email_change', 'signup', 'magiclink']

export async function POST(request: Request) {
  const { origin } = new URL(request.url)
  const neplatny = NextResponse.redirect(`${origin}/login?chyba=odkaz`, 303)

  // Jen z vlastní mezistránky. Cizí web by nám jinak mohl podstrčit token
  // svého účtu a nepozorovaně do něj přihlásit návštěvníka (login CSRF).
  const puvod = request.headers.get('origin')
  if (puvod && puvod !== origin) return neplatny

  const form = await request.formData()
  const tokenHash = String(form.get('token_hash') ?? '')
  const typ = String(form.get('type') ?? '') as EmailOtpType
  if (!tokenHash || !TYPY.includes(typ)) return neplatny

  const supabase = await createClient()
  const { data, error } = await supabase.auth.verifyOtp({ type: typ, token_hash: tokenHash })
  if (error || !data.user) return neplatny

  const vychozi = data.user.app_metadata?.role === 'advisor' ? '/advisor' : '/dashboard'
  // 303: po POST má prohlížeč cíl načíst obyčejným GET.
  return NextResponse.redirect(bezpecnyCil(String(form.get('next') ?? ''), origin, vychozi), 303)
}
