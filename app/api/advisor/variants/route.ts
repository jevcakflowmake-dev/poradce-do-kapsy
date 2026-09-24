import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { ocistiProdukt } from '@/lib/produkt-varianty'
import type { Database } from '@/lib/types/database'

type ZmenyVarianty = Database['public']['Tables']['plan_variants']['Update']

/** Chyba databáze jen do logu – poradce dostane českou větu, ne anglický detail. */
function chybaUlozeni(chyba: { message: string }) {
  console.error('[variants]', chyba.message)
  return NextResponse.json({ error: 'Změnu se nepodařilo uložit. Zkuste to prosím znovu.' }, { status: 500 })
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.app_metadata?.role !== 'advisor') {
      return NextResponse.json({ error: 'Nemáte oprávnění.' }, { status: 401 })
    }

    const body = await request.json()
    const { action, ...data } = body

    if (!action) {
      return NextResponse.json({ error: 'Chybí parametr action.' }, { status: 400 })
    }

    if (action === 'create_variant') {
      const { client_id, section, company, logo, monthly_payment, sort_order } = data
      if (!client_id || !section || !company) {
        return NextResponse.json({ error: 'Pro vytvoření varianty jsou povinné: client_id, section, company.' }, { status: 400 })
      }
      const { data: variant, error } = await supabase.from('plan_variants')
        .insert({ client_id, section, company, logo, monthly_payment, sort_order: sort_order || 0 })
        .select()
        .single()
      if (error) return chybaUlozeni(error)
      return NextResponse.json(variant)
    }

    if (action === 'update_variant') {
      const { variant_id, company, logo, monthly_payment, produkt } = data
      if (!variant_id) {
        return NextResponse.json({ error: 'Pro aktualizaci varianty je povinné: variant_id.' }, { status: 400 })
      }

      const zmeny: ZmenyVarianty = {}
      if (company !== undefined) zmeny.company = company
      if (logo !== undefined) zmeny.logo = logo
      if (monthly_payment !== undefined) zmeny.monthly_payment = monthly_payment

      if (produkt !== undefined) {
        // `details` u zajištění příjmu drží čísla rizik, takže sloupec nepřepisujeme
        // celý — načteme, co tam je, a doplníme jen klíč `produkt`.
        const { data: soucasne, error: chybaCteni } = await supabase.from('plan_variants')
          .select('details')
          .eq('id', variant_id)
          .single()
        if (chybaCteni) return chybaUlozeni(chybaCteni)

        const details = (soucasne?.details ?? {}) as Record<string, unknown>
        const ocisteny = ocistiProdukt(produkt)
        if (Object.keys(ocisteny).length > 0) {
          zmeny.details = { ...details, produkt: ocisteny } as unknown as ZmenyVarianty['details']
        } else {
          // Prázdný formulář = poradce detail smazal.
          const { produkt: _zahozeno, ...zbytek } = details
          zmeny.details = zbytek as unknown as ZmenyVarianty['details']
        }
      }

      if (Object.keys(zmeny).length === 0) return NextResponse.json({ ok: true })

      const { error } = await supabase.from('plan_variants')
        .update(zmeny)
        .eq('id', variant_id)
      if (error) return chybaUlozeni(error)
      return NextResponse.json({ ok: true })
    }

    if (action === 'delete_variant') {
      const { variant_id } = data
      if (!variant_id) {
        return NextResponse.json({ error: 'Pro smazání varianty je povinné: variant_id.' }, { status: 400 })
      }
      await supabase.from('plan_params').delete().eq('variant_id', variant_id)
      await supabase.from('plan_variants').delete().eq('id', variant_id)
      return NextResponse.json({ ok: true })
    }

    if (action === 'upsert_params') {
      const { variant_id, params } = data
      if (!variant_id || !Array.isArray(params)) {
        return NextResponse.json({ error: 'Pro uložení parametrů jsou povinné: variant_id, params (pole).' }, { status: 400 })
      }
      await supabase.from('plan_params').delete().eq('variant_id', variant_id)
      if (params.length > 0) {
        // Sloupce vyjmenováváme ručně: rozbalení `...p` z požadavku by pustilo
        // do tabulky cokoliv, co klient pošle (třeba vlastní `id`).
        const rows = params.map((p: Record<string, unknown>, i: number) => ({
          variant_id,
          param_key: String(p.param_key ?? p.param_label ?? ''),
          param_label: String(p.param_label ?? ''),
          value: String(p.value ?? ''),
          note: typeof p.note === 'string' ? p.note : '',
          sort_order: i,
        }))
        const { error } = await supabase.from('plan_params').insert(rows)
        if (error) return chybaUlozeni(error)
      }
      return NextResponse.json({ ok: true })
    }

    if (action === 'upsert_recommendation') {
      const { client_id, section, status, items } = data
      if (!client_id || !section) {
        return NextResponse.json({ error: 'Pro doporučení jsou povinné: client_id, section.' }, { status: 400 })
      }
      const { data: existing } = await supabase.from('plan_recommendations')
        .select('id')
        .eq('client_id', client_id)
        .eq('section', section)
        .single()

      if (existing) {
        const { error } = await supabase.from('plan_recommendations')
          .update({ status, items })
          .eq('id', existing.id)
        if (error) return chybaUlozeni(error)
      } else {
        const { error } = await supabase.from('plan_recommendations')
          .insert({ client_id, section, status, items })
        if (error) return chybaUlozeni(error)
      }
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'Neznámá akce.' }, { status: 400 })
  } catch {
    return NextResponse.json(
      { error: 'Nastala neočekávaná chyba. Zkuste to prosím znovu.' },
      { status: 500 }
    )
  }
}
