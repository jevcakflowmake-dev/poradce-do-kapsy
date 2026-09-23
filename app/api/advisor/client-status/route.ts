import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { isClientStatus } from '@/lib/utils'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.app_metadata?.role !== 'advisor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    const clientId = body?.client_id
    const status = body?.status

    if (typeof clientId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clientId)) {
      return NextResponse.json({ error: 'Neplatné client_id (UUID).' }, { status: 400 })
    }
    if (!isClientStatus(status)) {
      return NextResponse.json({ error: 'Neplatný status.' }, { status: 400 })
    }

    // Zápis až po ověření role a přes service role, stejně jako ostatní
    // routy poradce: přihlášený klient pak nemusí mít k `status` přístup
    // vůbec a vlastní stav si nepřepíše.
    const { error } = await createAdminClient()
      .from('profiles')
      .update({ status })
      .eq('id', clientId)

    if (error) {
      console.error('[client-status]', error.message)
      return NextResponse.json({ error: 'Stav se nepodařilo uložit.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, status })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Internal error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
