import { NextResponse, after } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { upozornitKlienta } from '@/lib/upozorneni'

/**
 * Upozornění klienta na novou zprávu v chatu. Volá ho chat poradce po
 * odeslání zprávy.
 *
 * E-mail jde jen u první zprávy po dvou hodinách ticha – když poradce
 * napíše tři zprávy za sebou, klientovi nepřijdou tři e-maily. Plán
 * a smlouvy upozorňují klienta ze svých vlastních rout.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const TICHO_MS = 2 * 60 * 60 * 1000

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.app_metadata?.role !== 'advisor') {
      return NextResponse.json({ error: 'Nemáte oprávnění.' }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    const klientId = body?.client_id
    if (body?.udalost !== 'nova_zprava' || typeof klientId !== 'string' || !UUID.test(klientId)) {
      return NextResponse.json({ error: 'Neplatný požadavek.' }, { status: 400 })
    }

    // Poslední dvě zprávy poradce: ta právě odeslaná a ta před ní.
    const { data: zpravy } = await createAdminClient()
      .from('messages')
      .select('created_at')
      .eq('client_id', klientId)
      .eq('sender_role', 'advisor')
      .order('created_at', { ascending: false })
      .limit(2)
    const predchozi = zpravy?.[1]?.created_at
    const posilat = !predchozi || Date.now() - new Date(predchozi).getTime() > TICHO_MS

    if (posilat) after(() => upozornitKlienta('nova_zprava', klientId))
    return NextResponse.json({ ok: true, odeslano: posilat })
  } catch (err) {
    console.error('[upozorneni] chyba:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Nastala neočekávaná chyba.' }, { status: 500 })
  }
}
