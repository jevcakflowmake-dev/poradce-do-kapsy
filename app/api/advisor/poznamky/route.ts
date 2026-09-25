import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Interní poznámky poradce ke klientovi. Stačí session poradce – tabulku
 * hlídá RLS (jen poradce, migrace 019), service role tu není potřeba.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MAX_DELKA = 5000

async function poradce() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.app_metadata?.role === 'advisor' ? supabase : null
}

export async function POST(request: Request) {
  const supabase = await poradce()
  if (!supabase) return NextResponse.json({ error: 'Nemáte oprávnění.' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const klientId = body?.client_id
  const text = typeof body?.text === 'string' ? body.text.trim() : ''
  if (typeof klientId !== 'string' || !UUID.test(klientId)) {
    return NextResponse.json({ error: 'Neplatný klient.' }, { status: 400 })
  }
  if (!text) return NextResponse.json({ error: 'Napište text poznámky.' }, { status: 400 })
  if (text.length > MAX_DELKA) {
    return NextResponse.json({ error: `Poznámka může mít nejvýš ${MAX_DELKA.toLocaleString('cs-CZ')} znaků.` }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('poznamky_klientu')
    .insert({ client_id: klientId, text })
    .select('id, text, created_at')
    .single()
  if (error) {
    console.error('[poznamky] uložení selhalo:', error.message)
    return NextResponse.json({ error: 'Poznámku se nepodařilo uložit.' }, { status: 500 })
  }
  return NextResponse.json({ ok: true, poznamka: data })
}

export async function DELETE(request: Request) {
  const supabase = await poradce()
  if (!supabase) return NextResponse.json({ error: 'Nemáte oprávnění.' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (typeof body?.id !== 'string' || !UUID.test(body.id)) {
    return NextResponse.json({ error: 'Neplatná poznámka.' }, { status: 400 })
  }
  const { error } = await supabase.from('poznamky_klientu').delete().eq('id', body.id)
  if (error) {
    console.error('[poznamky] smazání selhalo:', error.message)
    return NextResponse.json({ error: 'Poznámku se nepodařilo smazat.' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
