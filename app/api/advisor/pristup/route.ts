import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createPublicClient } from '@/lib/supabase/verejny'
import { absoluteUrl } from '@/lib/site'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Přístup pro klienta: odkaz, kterým si nastaví heslo a dostane se k plánu.
 * Typicky pro člověka, který vyplnil veřejnou analýzu bez hesla.
 *
 * Dvě cesty:
 * - `poslat: true` – e-mail pošle Supabase přes vlastní SMTP (šablona
 *   Reset password, v repu supabase/templates/nastaveni-hesla.html)
 * - jinak odkaz vrátíme poradci ke zkopírování (WhatsApp, vlastní e-mail)
 *
 * Odkaz ke zkopírování skládáme sami z hashed_token přes /auth/potvrzeni,
 * ne z action_linku Supabase: ten po ověření vracel session v #hash, se
 * kterým serverová routa nic nenadělá, a skenery pošty by ho spotřebovaly.
 * Platí vždy jen nejnovější odkaz – každý další ten předchozí zneplatní.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.app_metadata?.role !== 'advisor') {
      return NextResponse.json({ error: 'Nemáte oprávnění.' }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    const clientId = body?.client_id
    const poslat = body?.poslat === true

    if (typeof clientId !== 'string' || !UUID_REGEX.test(clientId)) {
      return NextResponse.json({ error: 'Neplatné client_id.' }, { status: 400 })
    }

    const admin = createAdminClient()

    const { data: target, error: userError } = await admin.auth.admin.getUserById(clientId)
    if (userError || !target.user?.email) {
      return NextResponse.json({ error: 'Klient nenalezen.' }, { status: 404 })
    }

    if (poslat) {
      const { error } = await createPublicClient().auth.resetPasswordForEmail(target.user.email, {
        redirectTo: absoluteUrl('/update-password'),
      })
      if (error) {
        console.error('[pristup] e-mail neodešel:', error.message)
        const limit = error.status === 429
        return NextResponse.json(
          { error: limit ? 'Odkaz pro tohoto klienta jste vyžádali před chvílí. Zkuste to prosím za minutu.' : 'E-mail se nepodařilo odeslat.' },
          { status: limit ? 429 : 500 },
        )
      }
      return NextResponse.json({ ok: true, email: target.user.email, odeslano: true })
    }

    const { data, error } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email: target.user.email,
    })
    const hash = data?.properties?.hashed_token

    if (error || !hash) {
      if (error) console.error('[pristup] generateLink:', error.message)
      return NextResponse.json({ error: 'Odkaz se nepodařilo vygenerovat.' }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      email: target.user.email,
      link: absoluteUrl(`/auth/potvrzeni?token_hash=${encodeURIComponent(hash)}&type=recovery&next=/update-password`),
    })
  } catch (err) {
    console.error('[pristup] chyba:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Neočekávaná chyba.' }, { status: 500 })
  }
}
