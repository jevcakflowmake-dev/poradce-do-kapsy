import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { RISK_DEFS, type RiskKey } from '@/lib/income-risks'

interface IncomeVariantInput {
  id?: string                // pokud edituji existing
  company: string
  logo: string
  monthly_payment: string    // např. "850 Kč"
  waiting_period_days?: number | null  // karence (default 14)
  max_payout_years?: number | null
  accident_pn_combine?: boolean        // sčítat denní odškodné za úraz s PN při úrazu?
  coverage?: Partial<Record<RiskKey, number | null>>
}

const DEFAULT_WAITING_PERIOD_DAYS = 14
const DAYS_IN_MONTH = 30

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

    // Výpočet měsíční výplaty serverside, ať klient pracuje s konzistentní hodnotou:
    //   60 % (úraz)  = daily_accident × 30   (případně + PN × (30 − karence) pokud accident_pn_combine)
    //   50 % (nemoc) = daily_sick_leave × (30 − karence)   (default karence 14)
    const karence = toNum(v.waiting_period_days) ?? DEFAULT_WAITING_PERIOD_DAYS
    const dailyAccident = toNum(v.coverage?.daily_accident) ?? 0
    const dailySickLeave = toNum(v.coverage?.daily_sick_leave) ?? 0
    const accidentPnCombine = Boolean(v.accident_pn_combine)
    const pnAfterKarence = dailySickLeave * Math.max(0, DAYS_IN_MONTH - karence)
    const payout60 = Math.round(dailyAccident * DAYS_IN_MONTH + (accidentPnCombine ? pnAfterKarence : 0))
    const payout50 = Math.round(pnAfterKarence)

    return {
      client_id: body.client_id,
      section: 'income',
      company: v.company.trim(),
      logo: v.logo.trim() || v.company.trim().charAt(0).toUpperCase(),
      monthly_payment: v.monthly_payment.trim(),
      sort_order: idx,
      details: {
        payout_60: payout60,
        payout_50: payout50,
        waiting_period_days: karence,
        max_payout_years: toNum(v.max_payout_years),
        accident_pn_combine: accidentPnCombine,
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
