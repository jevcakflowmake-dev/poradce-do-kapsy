import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { clientId, responses, files } = await request.json()

  if (!clientId || !responses) {
    return NextResponse.json({ error: 'Missing data' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Upsert all responses
  for (const [sectionId, questions] of Object.entries(responses as Record<string, Record<string, string>>)) {
    for (const [questionId, value] of Object.entries(questions)) {
      if (!value) continue
      await supabase.from('analysis_responses').upsert(
        { client_id: clientId, section: sectionId, question_id: questionId, value, updated_at: new Date().toISOString() },
        { onConflict: 'client_id,section,question_id' }
      )
    }
  }

  return NextResponse.json({ success: true })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get('clientId')

  if (!clientId) {
    return NextResponse.json({ error: 'Missing clientId' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: responses } = await supabase
    .from('analysis_responses')
    .select('*')
    .eq('client_id', clientId)

  const { data: files } = await supabase
    .from('analysis_files')
    .select('*')
    .eq('client_id', clientId)

  // Group responses by section
  const grouped: Record<string, Record<string, string>> = {}
  for (const r of responses || []) {
    if (!grouped[r.section]) grouped[r.section] = {}
    grouped[r.section][r.question_id] = r.value
  }

  return NextResponse.json({ responses: grouped, files: files || [] })
}
