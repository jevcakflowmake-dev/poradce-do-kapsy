import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { absoluteUrl } from '@/lib/site'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Vygeneruje klientovi odkaz, kterým si nastaví heslo a dostane se k plánu.
 *
 * Typicky pro člověka, který vyplnil veřejnou analýzu a heslo si nezvolil –
 * účet má, ale přihlásit se s ním zatím nedá.
 *
 * Odkaz VRACÍME poradci, aby ho mohl poslat sám (e-mailem, WhatsApp).
 * Supabase se ho zároveň pokusí odeslat, ale dokud není nastavené vlastní
 * SMTP, výchozí brána zvládne ~2 e-maily/hod a jen na členy týmu – proto se
 * na její doručení nespoléháme.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.user_metadata?.role !== 'advisor') {
      return NextResponse.json({ error: 'Nemáte oprávnění.' }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    const clientId = body?.client_id

    if (typeof clientId !== 'string' || !UUID_REGEX.test(clientId)) {
      return NextResponse.json({ error: 'Neplatné client_id.' }, { status: 400 })
    }

    const admin = createAdminClient()

    const { data: target, error: userError } = await admin.auth.admin.getUserById(clientId)
    if (userError || !target.user?.email) {
      return NextResponse.json({ error: 'Klient nenalezen.' }, { status: 404 })
    }

    const { data, error } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email: target.user.email,
      options: {
        redirectTo: absoluteUrl('/auth/callback?next=/update-password'),
      },
    })

    if (error || !data.properties?.action_link) {
      return NextResponse.json(
        { error: error?.message || 'Odkaz se nepodařilo vygenerovat.' },
        { status: 500 },
      )
    }

    return NextResponse.json({
      ok: true,
      email: target.user.email,
      link: data.properties.action_link,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Neočekávaná chyba'
    console.error('[pristup] chyba:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
