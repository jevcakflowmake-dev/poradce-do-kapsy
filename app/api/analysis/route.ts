import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(request: Request) {
  try {
    const { clientId, responses } = await request.json()

    if (!clientId || !responses) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 })
    }

    if (!UUID_REGEX.test(clientId)) {
      return NextResponse.json({ error: 'Neplatný formát clientId' }, { status: 400 })
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

    // Sync key fields from analysis to profile
    const personal = responses.personal as Record<string, string> | undefined
    const incomeSection = responses.income as Record<string, string> | undefined
    if (personal || incomeSection) {
      const updates: { full_name?: string; phone?: string; age?: number; income?: string; updated_at?: string } = {}
      if (personal?.full_name) updates.full_name = personal.full_name
      if (personal?.phone) updates.phone = personal.phone
      if (personal?.age) updates.age = parseInt(personal.age) || undefined
      if (incomeSection?.monthly_income) updates.income = incomeSection.monthly_income
      if (Object.keys(updates).length > 0) {
        updates.updated_at = new Date().toISOString()
        await supabase.from('profiles').update(updates).eq('id', clientId)
      }
    }

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
