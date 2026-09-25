import { NextResponse, after } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { upozornitKlienta } from '@/lib/upozorneni'

/**
 * Zveřejnění finančního plánu klientovi (migrace 017).
 *
 *   zverejnit – klient plán uvidí a přijde mu e-mail „plán je připravený“
 *   skryt     – plán klientovi zase zmizí (třeba když se zveřejnil omylem)
 *   upozornit – plán už klient vidí, jen mu dáme vědět, že se změnil
 *
 * Sloupec zapisuje service role až po ověření role poradce; klient ho
 * v profilu měnit nesmí (migrace 016).
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const AKCE = ['zverejnit', 'skryt', 'upozornit'] as const

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.app_metadata?.role !== 'advisor') {
      return NextResponse.json({ error: 'Nemáte oprávnění.' }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    const klientId = body?.client_id
    const akce = AKCE.find((a) => a === body?.akce)
    if (typeof klientId !== 'string' || !UUID.test(klientId) || !akce) {
      return NextResponse.json({ error: 'Neplatný požadavek.' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data: profil } = await admin.from('profiles').select('id, plan_zverejnen_at').eq('id', klientId).maybeSingle()
    if (!profil) return NextResponse.json({ error: 'Klient neexistuje.' }, { status: 404 })

    if (akce === 'upozornit') {
      if (!profil.plan_zverejnen_at) {
        return NextResponse.json({ error: 'Plán ještě není zveřejněný – zveřejněte ho.' }, { status: 400 })
      }
      after(() => upozornitKlienta('plan_upraven', klientId))
      return NextResponse.json({ ok: true, plan_zverejnen_at: profil.plan_zverejnen_at })
    }

    if (akce === 'zverejnit') {
      const { count } = await admin
        .from('plan_variants')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', klientId)
      const { count: doporuceni } = await admin
        .from('plan_recommendations')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', klientId)
      if (!count && !doporuceni) {
        return NextResponse.json({ error: 'Plán je prázdný – přidejte aspoň jednu variantu nebo doporučení.' }, { status: 400 })
      }
    }

    const hodnota = akce === 'zverejnit' ? new Date().toISOString() : null
    const { error } = await admin.from('profiles').update({ plan_zverejnen_at: hodnota }).eq('id', klientId)
    if (error) {
      console.error('[plan/zverejneni]', error.message)
      return NextResponse.json({ error: 'Změnu se nepodařilo uložit.' }, { status: 500 })
    }
    if (akce === 'zverejnit') after(() => upozornitKlienta('plan_zverejnen', klientId))
    return NextResponse.json({ ok: true, plan_zverejnen_at: hodnota })
  } catch (err) {
    console.error('[plan/zverejneni] chyba:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Nastala neočekávaná chyba.' }, { status: 500 })
  }
}
