import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.user_metadata?.role !== 'advisor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, ...data } = body

    if (!action) {
      return NextResponse.json({ error: 'Chybí parametr action' }, { status: 400 })
    }

    if (action === 'create_variant') {
      const { client_id, section, company, logo, monthly_payment, sort_order } = data
      if (!client_id || !section || !company) {
        return NextResponse.json({ error: 'Pro vytvoření varianty jsou povinné: client_id, section, company' }, { status: 400 })
      }
      const { data: variant, error } = await (supabase.from('plan_variants') as any)
        .insert({ client_id, section, company, logo, monthly_payment, sort_order: sort_order || 0 })
        .select()
        .single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json(variant)
    }

    if (action === 'update_variant') {
      const { variant_id, company, logo, monthly_payment } = data
      if (!variant_id) {
        return NextResponse.json({ error: 'Pro aktualizaci varianty je povinné: variant_id' }, { status: 400 })
      }
      const { error } = await (supabase.from('plan_variants') as any)
        .update({ company, logo, monthly_payment })
        .eq('id', variant_id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true })
    }

    if (action === 'delete_variant') {
      const { variant_id } = data
      if (!variant_id) {
        return NextResponse.json({ error: 'Pro smazání varianty je povinné: variant_id' }, { status: 400 })
      }
      await (supabase.from('plan_params') as any).delete().eq('variant_id', variant_id)
      await (supabase.from('plan_variants') as any).delete().eq('id', variant_id)
      return NextResponse.json({ ok: true })
    }

    if (action === 'upsert_params') {
      const { variant_id, params } = data
      if (!variant_id || !Array.isArray(params)) {
        return NextResponse.json({ error: 'Pro upsert parametrů jsou povinné: variant_id, params (pole)' }, { status: 400 })
      }
      await (supabase.from('plan_params') as any).delete().eq('variant_id', variant_id)
      if (params.length > 0) {
        const rows = params.map((p: Record<string, unknown>, i: number) => ({
          ...p,
          variant_id,
          sort_order: i,
        }))
        const { error } = await (supabase.from('plan_params') as any).insert(rows)
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ ok: true })
    }

    if (action === 'upsert_recommendation') {
      const { client_id, section, status, items } = data
      if (!client_id || !section) {
        return NextResponse.json({ error: 'Pro doporučení jsou povinné: client_id, section' }, { status: 400 })
      }
      const { data: existing } = await (supabase.from('plan_recommendations') as any)
        .select('id')
        .eq('client_id', client_id)
        .eq('section', section)
        .single()

      if (existing) {
        const { error } = await (supabase.from('plan_recommendations') as any)
          .update({ status, items })
          .eq('id', existing.id)
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      } else {
        const { error } = await (supabase.from('plan_recommendations') as any)
          .insert({ client_id, section, status, items })
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'Neznámá akce' }, { status: 400 })
  } catch {
    return NextResponse.json(
      { error: 'Nastala neočekávaná chyba. Zkuste to prosím znovu.' },
      { status: 500 }
    )
  }
}
