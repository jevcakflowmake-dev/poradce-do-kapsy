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
  /** Uložené varianty, které poradce v editoru odebral nebo vyprázdnil. */
  odebrane?: string[]
}

function toNum(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = typeof v === 'string' ? Number(v.replace(',', '.')) : Number(v)
  return Number.isFinite(n) ? n : null
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.app_metadata?.role !== 'advisor') {
    return NextResponse.json({ error: 'Nemáte oprávnění.' }, { status: 401 })
  }

  const body = (await request.json()) as Payload
  if (!body.client_id || !Array.isArray(body.variants)) {
    return NextResponse.json({ error: 'Chybí client_id nebo variants[].' }, { status: 400 })
  }
  if (body.variants.length > 3) {
    return NextResponse.json({ error: 'Maximálně 3 varianty.' }, { status: 400 })
  }

  const chyba = (kde: string, zprava: string) => {
    console.error(`[plan/income] ${kde}:`, zprava)
    return NextResponse.json({ error: 'Varianty se nepodařilo uložit. Zkuste to prosím znovu.' }, { status: 500 })
  }

  // Ukládá se podle id, ne smazáním a novým vložením: na variantu se váže
  // výběr klienta, parametry, detail produktu, graf i převedená smlouva
  // (content.zVarianty) a nové id by to všechno odpojilo nebo smazalo.
  const { data: stavajici, error: chybaCteni } = await supabase.from('plan_variants')
    .select('id, details')
    .eq('client_id', body.client_id)
    .eq('section', 'income')
  if (chybaCteni) return chyba('čtení', chybaCteni.message)
  const podleId = new Map((stavajici ?? []).map((v) => [v.id as string, v]))

  // Mažou se jen varianty, které poradce v editoru odebral. Varianty
  // přidané mezitím jinde (editor plánu) zůstávají.
  const odebrat = (Array.isArray(body.odebrane) ? body.odebrane : []).filter(
    (id): id is string => typeof id === 'string' && podleId.has(id),
  )
  if (odebrat.length > 0) {
    const { error } = await supabase.from('plan_variants').delete().in('id', odebrat).eq('client_id', body.client_id)
    if (error) return chyba('mazání', error.message)
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

  // Vrací se ve stejném pořadí jako přišly varianty – editor si podle
  // toho doplní id nově vložených.
  const data = []
  for (const [idx, radek] of rows.entries()) {
    const puvodni = body.variants[idx].id ? podleId.get(body.variants[idx].id as string) : undefined
    if (puvodni && !odebrat.includes(puvodni.id as string)) {
      // Detail produktu, graf a další klíče z editoru plánu zůstávají.
      const details = { ...((puvodni.details ?? {}) as Record<string, unknown>), ...radek.details }
      const { data: ulozena, error } = await supabase.from('plan_variants')
        .update({ company: radek.company, logo: radek.logo, monthly_payment: radek.monthly_payment, sort_order: radek.sort_order, details })
        .eq('id', puvodni.id)
        .eq('client_id', body.client_id)
        .select()
        .single()
      if (error) return chyba('úprava', error.message)
      data.push(ulozena)
    } else {
      const { data: nova, error } = await supabase.from('plan_variants').insert(radek).select().single()
      if (error) return chyba('zápis', error.message)
      data.push(nova)
    }
  }

  return NextResponse.json({ data })
}
