import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  computeRecommendation,
  type Answers,
} from '@/src/questionnaires/zajisteni-prijmu.questionnaire'

/**
 * Spočítá doporučení z odeslaného dotazníku a uloží ho do questionnaire_reviews.
 * Do té tabulky klient přes RLS nesmí (je jen pro poradce), proto zápis běží
 * pod service role. Ověřujeme ale, že volající je vlastník dotazníku – ať si
 * nikdo nenechá přepočítat cizí.
 */
export async function POST(request: Request) {
  const { id } = (await request.json().catch(() => ({}))) as { id?: string }
  if (!id) {
    return NextResponse.json({ error: 'Chybí id dotazníku' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })
  }

  // Načtení přes uživatelovu session = RLS ověří vlastnictví (nebo roli poradce).
  const { data: dotaznik, error } = await supabase
    .from('questionnaires')
    .select('id, answers, status')
    .eq('id', id)
    .single()

  if (error || !dotaznik) {
    return NextResponse.json({ error: 'Dotazník nenalezen' }, { status: 404 })
  }
  if (dotaznik.status === 'draft') {
    return NextResponse.json({ error: 'Dotazník ještě není odeslaný' }, { status: 409 })
  }

  const recommendation = computeRecommendation((dotaznik.answers as unknown as Answers) ?? {})

  // Zápis do reviews pod service role; trigger sync_flags zrcadlí flags.
  const admin = createAdminClient()
  const { error: writeError } = await admin
    .from('questionnaire_reviews')
    .upsert(
      {
        questionnaire_id: id,
        recommendation: recommendation as never,
      },
      { onConflict: 'questionnaire_id' },
    )

  if (writeError) {
    return NextResponse.json({ error: writeError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, flags: recommendation.flags.length })
}
