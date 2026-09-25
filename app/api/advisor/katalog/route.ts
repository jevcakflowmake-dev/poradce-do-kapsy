import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ctiProdukt } from '@/lib/produkt-varianty'
import { ctiProjekci } from '@/lib/projekce'
import { ctiSablonu, ocistiParametry, vychoziVynos, SEKCE_KATALOGU } from '@/lib/katalog'

/**
 * Katalog produktů. Šablona se skládá na serveru z uložené varianty, ne
 * z toho, co pošle prohlížeč. Stačí session poradce – tabulku hlídá RLS
 * (migrace 020).
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function poradce() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.app_metadata?.role === 'advisor' ? supabase : null
}

export async function POST(request: Request) {
  const supabase = await poradce()
  if (!supabase) return NextResponse.json({ error: 'Nemáte oprávnění.' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const variantId = body?.variant_id
  if (typeof variantId !== 'string' || !UUID.test(variantId)) {
    return NextResponse.json({ error: 'Neplatná varianta.' }, { status: 400 })
  }

  const [{ data: varianta }, { data: parametry }] = await Promise.all([
    supabase.from('plan_variants').select('section, company, logo, monthly_payment, details').eq('id', variantId).maybeSingle(),
    supabase.from('plan_params').select('param_label, value, note').eq('variant_id', variantId).order('sort_order'),
  ])
  if (!varianta) return NextResponse.json({ error: 'Varianta neexistuje.' }, { status: 404 })
  if (!(SEKCE_KATALOGU as readonly string[]).includes(varianta.section)) {
    return NextResponse.json({ error: 'Tuhle oblast do katalogu uložit nejde.' }, { status: 400 })
  }

  const produkt = ctiProdukt(varianta.details) ?? {}
  const spolecnost = varianta.company.trim().slice(0, 120)
  const nazev = (produkt.nazev ?? spolecnost).slice(0, 120)
  // Šablona se stejným názvem v oblasti se nahradí – jinak by se po každé
  // úpravě varianty katalog plnil kopiemi.
  const { data: stare } = await supabase
    .from('katalog_produktu')
    .select('id, nazev, spolecnost')
    .eq('sekce', varianta.section)
  const nahrazene = (stare ?? [])
    .filter((s) => s.nazev.toLowerCase() === nazev.toLowerCase() && s.spolecnost.toLowerCase() === spolecnost.toLowerCase())
    .map((s) => s.id)

  const { data: nova, error } = await supabase
    .from('katalog_produktu')
    .insert({
      sekce: varianta.section,
      nazev,
      spolecnost,
      logo: (varianta.logo ?? '').trim().slice(0, 10),
      mesicni_platba: (varianta.monthly_payment ?? '').trim().slice(0, 60),
      produkt: { ...produkt },
      parametry: ocistiParametry(parametry ?? []).map((p) => ({ ...p })),
      vynos: ctiProjekci(varianta.details)?.vynos ?? vychoziVynos(varianta.details),
    })
    .select('*')
    .single()
  if (error || !nova) {
    console.error('[katalog] uložení selhalo:', error?.message)
    return NextResponse.json({ error: 'Šablonu se nepodařilo uložit.' }, { status: 500 })
  }
  if (nahrazene.length) await supabase.from('katalog_produktu').delete().in('id', nahrazene)
  return NextResponse.json({ ok: true, sablona: ctiSablonu(nova), nahrazene })
}

export async function DELETE(request: Request) {
  const supabase = await poradce()
  if (!supabase) return NextResponse.json({ error: 'Nemáte oprávnění.' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (typeof body?.id !== 'string' || !UUID.test(body.id)) {
    return NextResponse.json({ error: 'Neplatná šablona.' }, { status: 400 })
  }
  const { error } = await supabase.from('katalog_produktu').delete().eq('id', body.id)
  if (error) {
    console.error('[katalog] smazání selhalo:', error.message)
    return NextResponse.json({ error: 'Šablonu se nepodařilo smazat.' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
