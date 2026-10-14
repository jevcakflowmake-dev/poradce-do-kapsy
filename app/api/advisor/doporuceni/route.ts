import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ODMENA_KC } from '@/lib/doporuceni'

/**
 * Věrnostní body za doporučení – ruční úpravy poradce (lib/doporuceni.ts).
 * Stačí session poradce, tabulku hlídá RLS (jen poradce, migrace 021).
 *
 * POST   přiřadí doporučitele (když jméno z analýzy nesedí nebo chybí)
 * PATCH  označí poukázku jako vyplacenou, nebo vyplacení vrátí
 * DELETE odebere doporučení (jen nevyplacené – vyplacené je doklad)
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function poradce() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.app_metadata?.role === 'advisor' ? supabase : null
}

const chyba = (text: string, status: number) => NextResponse.json({ error: text }, { status })

export async function POST(request: Request) {
  const supabase = await poradce()
  if (!supabase) return chyba('Nemáte oprávnění.', 401)

  const body = await request.json().catch(() => null)
  const doporuceny = body?.doporuceny_id
  const doporucitel = body?.doporucitel_id
  if (typeof doporuceny !== 'string' || !UUID.test(doporuceny) || typeof doporucitel !== 'string' || !UUID.test(doporucitel)) {
    return chyba('Neplatný klient.', 400)
  }
  if (doporuceny === doporucitel) return chyba('Klient nemůže doporučit sám sebe.', 400)

  const { data: stavajici } = await supabase
    .from('doporuceni')
    .select('vyplaceno_at')
    .eq('doporuceny_id', doporuceny)
    .maybeSingle()
  if (stavajici?.vyplaceno_at) return chyba('Poukázka už je vyplacená. Nejdřív vyplacení vraťte.', 409)

  const { error } = await supabase
    .from('doporuceni')
    .upsert(
      { doporuceny_id: doporuceny, doporucitel_id: doporucitel, odmena_kc: ODMENA_KC, prirazeno_rucne: true },
      { onConflict: 'doporuceny_id' },
    )
  if (error) {
    console.error('[doporuceni] přiřazení selhalo:', error.message)
    return chyba('Doporučení se nepodařilo uložit.', 500)
  }
  return NextResponse.json({ ok: true })
}

export async function PATCH(request: Request) {
  const supabase = await poradce()
  if (!supabase) return chyba('Nemáte oprávnění.', 401)

  const body = await request.json().catch(() => null)
  const doporuceny = body?.doporuceny_id
  if (typeof doporuceny !== 'string' || !UUID.test(doporuceny) || typeof body?.vyplaceno !== 'boolean') {
    return chyba('Neplatný požadavek.', 400)
  }

  const { data, error } = await supabase
    .from('doporuceni')
    .update({ vyplaceno_at: body.vyplaceno ? new Date().toISOString() : null })
    .eq('doporuceny_id', doporuceny)
    .select('doporuceny_id')
  if (error) {
    console.error('[doporuceni] výplata selhala:', error.message)
    return chyba('Změnu se nepodařilo uložit.', 500)
  }
  if (!data?.length) return chyba('Doporučení nenalezeno.', 404)
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request) {
  const supabase = await poradce()
  if (!supabase) return chyba('Nemáte oprávnění.', 401)

  const body = await request.json().catch(() => null)
  const doporuceny = body?.doporuceny_id
  if (typeof doporuceny !== 'string' || !UUID.test(doporuceny)) return chyba('Neplatný klient.', 400)

  const { data, error } = await supabase
    .from('doporuceni')
    .delete()
    .eq('doporuceny_id', doporuceny)
    .is('vyplaceno_at', null)
    .select('doporuceny_id')
  if (error) {
    console.error('[doporuceni] odebrání selhalo:', error.message)
    return chyba('Doporučení se nepodařilo odebrat.', 500)
  }
  if (!data?.length) return chyba('Vyplacené doporučení nejde odebrat. Nejdřív vyplacení vraťte.', 409)
  return NextResponse.json({ ok: true })
}
