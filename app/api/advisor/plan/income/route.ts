import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { RISK_DEFS, type RiskKey } from '@/lib/income-risks'

interface IncomeVariantInput {
  id?: string                // pokud edituji existing
  company: string
  logo: string
  monthly_payment: string    // např. "850 Kč"
  payout_60: number | null   // měsíční výplata při poklesu na 60% (Kč)
  payout_50: number | null
  waiting_period_days?: number | null
  max_payout_years?: number | null
  coverage?: Partial<Record<RiskKey, number | null>>
}

interface Payload {
  client_id: string
  variants: IncomeVariantInput[]
}

function toNum(v: unknown): number | null {
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
  if (!body.client_id || !Array.isArray(body.variants)) {
    return NextResponse.json({ error: 'Missing client_id or variants[]' }, { status: 400 })
  }
  if (body.variants.length > 3) {
    return NextResponse.json({ error: 'Maximálně 3 varianty' }, { status: 400 })
  }

  // Smaž existující income varianty (i s params přes ON DELETE CASCADE)
  const { error: delErr } = await (supabase.from('plan_variants') as any)
    .delete()
    .eq('client_id', body.client_id)
    .eq('section', 'income')
  if (delErr) {
    return NextResponse.json({ error: delErr.message }, { status: 500 })
  }

  if (body.variants.length === 0) {
    return NextResponse.json({ data: [] })
  }

  const rows = body.variants.map((v, idx) => {
    const coverage: Record<string, number | null> = {}
    if (v.coverage) {
      for (const def of RISK_DEFS) {
        coverage[def.key] = toNum(v.coverage[def.key])
      }
    }
    return {
      client_id: body.client_id,
      section: 'income',
      company: v.company.trim(),
      logo: v.logo.trim() || v.company.trim().charAt(0).toUpperCase(),
      monthly_payment: v.monthly_payment.trim(),
      sort_order: idx,
      details: {
        payout_60: toNum(v.payout_60),
        payout_50: toNum(v.payout_50),
        waiting_period_days: toNum(v.waiting_period_days),
        max_payout_years: toNum(v.max_payout_years),
        ...coverage,
      },
    }
  })

  const { data, error } = await (supabase.from('plan_variants') as any)
    .insert(rows)
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}
