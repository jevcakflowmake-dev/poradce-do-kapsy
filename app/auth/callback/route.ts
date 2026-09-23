import { createClient } from '@/lib/supabase/server'
import { bezpecnyCil } from '@/lib/presmerovani'
import { NextResponse } from 'next/server'

/**
 * Starší cesta z e-mailových odkazů přes `?code=` (PKCE). Funguje jen ve
 * stejném prohlížeči, kde si člověk o odkaz řekl. Nové šablony vedou na
 * /auth/potvrzeni, tahle routa zůstává kvůli odkazům, které už odešly.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(bezpecnyCil(searchParams.get('next'), origin))
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
