import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { syncProfileFromResponses, type Responses } from '@/lib/submissions'
import { NextResponse } from 'next/server'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Endpoint běží pod service role, takže si sám musí ohlídat, kdo na koho smí —
 * RLS ho neochrání. Klient jen sám sebe, poradce kohokoliv.
 *
 * Anonymní analýzu z /analyza sem neposílejte: má vlastní endpoint
 * /api/analyza/odeslat, který navíc validuje vstup a zakládá klienta.
 */
async function authorize(clientId: string): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, status: 401, error: 'Nejste přihlášeni.' }
  }
  if (user.user_metadata?.role === 'advisor') {
    return { ok: true }
  }
  if (user.id !== clientId) {
    return { ok: false, status: 403, error: 'K těmto datům nemáte přístup.' }
  }
  return { ok: true }
}

export async function POST(request: Request) {
  try {
    const { clientId, responses } = await request.json()

    if (!clientId || !responses) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 })
    }

    if (!UUID_REGEX.test(clientId)) {
      return NextResponse.json({ error: 'Neplatný formát clientId' }, { status: 400 })
    }

    const auth = await authorize(clientId)
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const supabase = createAdminClient()

    // Upsert all responses
    for (const [sectionId, questions] of Object.entries(responses as Record<string, Record<string, string>>)) {
      for (const [questionId, value] of Object.entries(questions)) {
        if (!value) continue
        await (supabase.from('analysis_responses') as any).upsert(
          { client_id: clientId, section: sectionId, question_id: questionId, value, updated_at: new Date().toISOString() },
          { onConflict: 'client_id,section,question_id' }
        )
      }
    }

    // Promítnout klíčová pole do profilu. Sdílíme tu samou funkci jako veřejný
    // formulář — jinak by se přihlášená a anonymní cesta rozešly v tom, co
    // poradce v panelu uvidí (rodinný stav, rizikový profil).
    await syncProfileFromResponses(supabase, clientId, responses as Responses)

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: 'Nastala neočekávaná chyba při ukládání analýzy.' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')

    if (!clientId) {
      return NextResponse.json({ error: 'Missing clientId' }, { status: 400 })
    }

    if (!UUID_REGEX.test(clientId)) {
      return NextResponse.json({ error: 'Neplatný formát clientId' }, { status: 400 })
    }

    const auth = await authorize(clientId)
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const supabase = createAdminClient()

    const { data: responses } = await (supabase.from('analysis_responses') as any)
      .select('*')
      .eq('client_id', clientId)

    const { data: files } = await (supabase.from('analysis_files') as any)
      .select('*')
      .eq('client_id', clientId)

    // Group responses by section
    const grouped: Record<string, Record<string, string>> = {}
    for (const r of (responses || []) as Array<{ section: string; question_id: string; value: string }>) {
      if (!grouped[r.section]) grouped[r.section] = {}
      grouped[r.section][r.question_id] = r.value
    }

    return NextResponse.json({ responses: grouped, files: files || [] })
  } catch {
    return NextResponse.json(
      { error: 'Nastala neočekávaná chyba při načítání analýzy.' },
      { status: 500 }
    )
  }
}
