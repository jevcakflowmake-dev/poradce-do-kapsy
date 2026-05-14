import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

interface Payload {
  client_id?: string
  age?: number | null
  retirement_age?: number | null
  monthly_income_net?: number | null
  dependents_count?: number | null
  has_mortgage?: boolean
  mortgage_remaining_amount?: number | null
  mortgage_remaining_years?: number | null
  property_value_real_estate?: number | null
  property_value_movables?: number | null
  notes?: string | null
}

function toNumberOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = typeof v === 'string' ? Number(v.replace(',', '.')) : Number(v)
  return Number.isFinite(n) ? n : null
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'advisor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await request.json()) as Payload
  if (!body.client_id) {
    return NextResponse.json({ error: 'Missing client_id' }, { status: 400 })
  }

  const upsertData = {
    client_id: body.client_id,
    age: toNumberOrNull(body.age),
    retirement_age: toNumberOrNull(body.retirement_age) ?? 65,
    monthly_income_net: toNumberOrNull(body.monthly_income_net),
    dependents_count: toNumberOrNull(body.dependents_count) ?? 0,
    has_mortgage: Boolean(body.has_mortgage),
    mortgage_remaining_amount: toNumberOrNull(body.mortgage_remaining_amount),
    mortgage_remaining_years: toNumberOrNull(body.mortgage_remaining_years),
    property_value_real_estate: toNumberOrNull(body.property_value_real_estate),
    property_value_movables: toNumberOrNull(body.property_value_movables),
    notes: body.notes ?? null,
  }

  const { data, error } = await (supabase.from('client_financials') as any)
    .upsert(upsertData, { onConflict: 'client_id' })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}
