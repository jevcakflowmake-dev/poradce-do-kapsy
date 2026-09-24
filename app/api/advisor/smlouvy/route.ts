import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { FREKVENCE_PLATEB, TYP_SMLOUVY_PODLE_SEKCE, naIban, type TypSmlouvy } from '@/lib/smlouvy'
import { obsahZVarianty } from '@/lib/smlouva-z-varianty'

/**
 * Převod vybrané varianty plánu na smlouvu v Moje smlouvy klienta.
 *
 * Zápis jde přes service role až po ověření role poradce, jako u ostatních
 * rout poradce. Data o produktu a krytí se berou z varianty v databázi, ne
 * z požadavku – z formuláře přichází jen to, co vzniklo podpisem.
 *
 * PDF smlouvy nahrává prohlížeč rovnou do storage (Vercel pustí do funkce
 * nejvýš 4,5 MB a smlouva i s podmínkami bývá větší); sem přijde jen cesta.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const TYPY: readonly TypSmlouvy[] = ['insurance', 'pension', 'invest']

const text = (hodnota: unknown, max: number) => (typeof hodnota === 'string' ? hodnota.trim().slice(0, max) : '')

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.app_metadata?.role !== 'advisor') {
      return NextResponse.json({ error: 'Nemáte oprávnění.' }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    const klientId = body?.client_id
    const variantaId = body?.variant_id
    if (typeof klientId !== 'string' || !UUID.test(klientId) || typeof variantaId !== 'string' || !UUID.test(variantaId)) {
      return NextResponse.json({ error: 'Neplatný klient nebo varianta.' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data: varianta } = await admin
      .from('plan_variants')
      .select('id, client_id, section, company, monthly_payment, details')
      .eq('id', variantaId)
      .maybeSingle()
    if (!varianta || varianta.client_id !== klientId) {
      return NextResponse.json({ error: 'Varianta u tohoto klienta není.' }, { status: 404 })
    }
    if (!TYP_SMLOUVY_PODLE_SEKCE[varianta.section]) {
      return NextResponse.json({ error: 'Z téhle oblasti plánu smlouvu převést nejde.' }, { status: 400 })
    }

    const nazev = text(body.title, 120)
    const typ = TYPY.find((t) => t === body.typ)
    const cisloSmlouvy = text(body.cisloSmlouvy, 40)
    const castka = Number(body.castka)
    const frekvence = FREKVENCE_PLATEB.find((f) => f === body.frekvence)
    const ucetVstup = text(body.ucet, 60)
    const ucet = ucetVstup ? naIban(ucetVstup) : null
    // Bez vlastního VS dáme číslice z čísla smlouvy – tak ho pojišťovny obvykle chtějí.
    const vs = (text(body.vs, 20) || cisloSmlouvy).replace(/\D/g, '').slice(0, 10)
    const zprava = text(body.zprava, 60)
    const souborCesta = text(body.file_url, 300)

    let chyba: string | null = null
    if (nazev.length < 2) chyba = 'Vyplňte název smlouvy.'
    else if (!typ) chyba = 'Vyberte, kam smlouva patří.'
    else if (!Number.isFinite(castka) || castka <= 0 || castka > 10_000_000) chyba = 'Zadejte předpis platby v korunách.'
    else if (!frekvence) chyba = 'Vyberte, jak často se platí.'
    else if (ucetVstup && !ucet) chyba = 'Číslo účtu nevypadá platně – zkontrolujte ho, QR platba by vedla jinam.'
    else if (souborCesta && (!souborCesta.startsWith(`${klientId}/`) || souborCesta.includes('..'))) {
      chyba = 'Soubor se smlouvou je uložený mimo složku klienta.'
    }
    if (chyba || !typ || !frekvence) {
      return NextResponse.json({ error: chyba ?? 'Neplatné údaje.' }, { status: 400 })
    }

    const obsah = obsahZVarianty(varianta, {
      cisloSmlouvy,
      frekvence,
      platba: {
        ...(ucet ? { ucet } : {}),
        castka,
        ...(vs ? { vs } : {}),
        ...(zprava ? { zprava } : {}),
      },
    })

    const { data: smlouva, error } = await admin
      .from('proposals')
      .insert({
        client_id: klientId,
        type: typ,
        title: nazev,
        content: JSON.stringify(obsah),
        file_url: souborCesta || null,
      })
      .select('id')
      .single()

    if (error || !smlouva) {
      console.error('[smlouvy] zápis selhal:', error?.message)
      return NextResponse.json({ error: 'Smlouvu se nepodařilo uložit.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, id: smlouva.id })
  } catch (err) {
    console.error('[smlouvy] chyba:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Nastala neočekávaná chyba.' }, { status: 500 })
  }
}
