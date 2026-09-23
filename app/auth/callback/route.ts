import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Kam po přihlášení z odkazu pustit. Jen cesta v rámci webu.
 *
 * Dřív se `next` lepil za origin bez kontroly a `?next=@cizi.cz` z toho
 * udělal `https://poradcedokapsy.cz@cizi.cz` – prohlížeč bere část před
 * zavináčem jako jméno a odejde na cizí web, čerstvě přihlášený klient
 * tak mohl skončit na podvržené stránce.
 */
function cilPresmerovani(next: string | null, origin: string): URL {
  const vychozi = new URL('/dashboard', origin)
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return vychozi
  const cil = new URL(next, origin)
  return cil.origin === origin ? cil : vychozi
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(cilPresmerovani(searchParams.get('next'), origin))
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
