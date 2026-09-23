import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ipPozadavku, vytvorLimit } from '@/lib/rate-limit'

/**
 * Rozepsaná veřejná analýza. Ukládá se až od posledního kroku dotazníku,
 * kdy je znám e-mail a člověk na obrazovce vidí, že odpovědi držíme.
 *
 * Do tabulky se z prohlížeče nedá sáhnout (RLS bez politik), proto tahle
 * routa: běží pod service role a je jediná cesta dovnitř. Klíč konceptu
 * si drží prohlížeč v localStorage, takže se přepisuje jeden a ten samý řádek.
 */
const KLIC = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MAX_ZNAKU = 100_000
/** Koncepty obsahují zdravotní údaje, nedrží se déle než dva měsíce. */
const RETENCE_DNI = 60
/**
 * Prohlížeč ukládá nejvýš jednou za 1,5 s psaní v posledním kroku; 120 za
 * deset minut člověk nevyčerpá, skript s novými klíči ano.
 */
const prekroceno = vytvorLimit({ oknoMs: 10 * 60 * 1000, max: 120 })

export async function POST(request: Request) {
  try {
    if (prekroceno(ipPozadavku(request))) {
      return NextResponse.json({ error: 'Příliš mnoho požadavků.' }, { status: 429 })
    }

    const { draftKey, responses, step, email } = await request.json()

    if (typeof draftKey !== 'string' || !KLIC.test(draftKey)) {
      return NextResponse.json({ error: 'Neplatný klíč konceptu.' }, { status: 400 })
    }
    if (!responses || typeof responses !== 'object' || Array.isArray(responses)) {
      return NextResponse.json({ error: 'Neplatné odpovědi.' }, { status: 400 })
    }
    if (JSON.stringify(responses).length > MAX_ZNAKU) {
      return NextResponse.json({ error: 'Koncept je příliš velký.' }, { status: 413 })
    }

    const admin = createAdminClient()
    const { error } = await admin.from('analysis_drafts').upsert(
      {
        draft_key: draftKey,
        responses,
        step: Number.isFinite(step) ? Math.trunc(step) : 0,
        email: typeof email === 'string' && email.trim() ? email.trim().slice(0, 320) : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'draft_key' },
    )

    if (error) {
      // Koncept je jen pojistka, primární kopie leží v localStorage.
      console.error('[koncept]', error.message)
      return NextResponse.json({ error: 'Koncept se nepodařilo uložit.' }, { status: 500 })
    }

    // Úklid při zápisu: levné (index na updated_at) a nepotřebuje plánovač.
    const hranice = new Date(Date.now() - RETENCE_DNI * 24 * 60 * 60 * 1000).toISOString()
    await admin.from('analysis_drafts').delete().lt('updated_at', hranice)

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Neočekávaná chyba.' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { draftKey } = await request.json()
    if (typeof draftKey !== 'string' || !KLIC.test(draftKey)) {
      return NextResponse.json({ error: 'Neplatný klíč konceptu.' }, { status: 400 })
    }

    const admin = createAdminClient()
    await admin.from('analysis_drafts').delete().eq('draft_key', draftKey)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Neočekávaná chyba.' }, { status: 500 })
  }
}
