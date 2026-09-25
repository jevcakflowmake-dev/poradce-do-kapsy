import { NextResponse, after } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  FREKVENCE_PLATEB,
  TYP_SMLOUVY_PODLE_SEKCE,
  ctiSmlouvu,
  naIban,
  ocistiPolozkyKryti,
  platneDatum,
  type ObsahSmlouvy,
  type PlatbaSmlouvy,
  type TypSmlouvy,
} from '@/lib/smlouvy'
import { obsahZVarianty } from '@/lib/smlouva-z-varianty'
import { upozornitKlienta } from '@/lib/upozorneni'

/**
 * Smlouvy klienta v sekci Moje smlouvy – založení, úprava a smazání.
 *
 * POST s `variant_id` převede vybranou variantu plánu (produkt a krytí se
 * berou z varianty v databázi, ne z požadavku). POST bez varianty je ručně
 * zadaná smlouva – třeba ta, kterou klient už má odjinud. PATCH upraví
 * existující smlouvu včetně ukončení, DELETE ji smaže i se souborem.
 *
 * Zápis jde přes service role až po ověření role poradce, jako u ostatních
 * rout poradce. PDF nahrává prohlížeč rovnou do storage (Vercel pustí do
 * funkce nejvýš 4,5 MB a smlouva i s podmínkami bývá větší); sem přijde jen
 * cesta.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const TYPY: readonly TypSmlouvy[] = ['insurance', 'pension', 'invest']

const text = (hodnota: unknown, max: number) => (typeof hodnota === 'string' ? hodnota.trim().slice(0, max) : '')

async function overPoradce() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user && user.app_metadata?.role === 'advisor' ? user : null
}

/** Pole, která vznikají podpisem – stejná u převodu z varianty i u ruční smlouvy. */
function udajeZPodpisu(body: Record<string, unknown>, klientId: string, castkaPovinna: boolean) {
  const nazev = text(body.title, 120)
  const typ = TYPY.find((t) => t === body.typ)
  const cisloSmlouvy = text(body.cisloSmlouvy, 40)
  const castkaVstup = body.castka
  const castka = castkaVstup === null || castkaVstup === undefined || castkaVstup === '' ? null : Number(castkaVstup)
  const frekvence = FREKVENCE_PLATEB.find((f) => f === body.frekvence)
  const ucetVstup = text(body.ucet, 60)
  const ucet = ucetVstup ? naIban(ucetVstup) : null
  // Bez vlastního VS dáme číslice z čísla smlouvy – tak ho pojišťovny obvykle chtějí.
  const vs = (text(body.vs, 20) || cisloSmlouvy).replace(/\D/g, '').slice(0, 10)
  const zprava = text(body.zprava, 60)
  const souborCesta = text(body.file_url, 300)
  const odkaz = text(body.link_url, 500)
  const pocatekVstup = text(body.pocatek, 10)
  const pocatek = pocatekVstup ? platneDatum(pocatekVstup) : null

  let chyba: string | null = null
  if (nazev.length < 2) chyba = 'Vyplňte název smlouvy.'
  else if (!typ) chyba = 'Vyberte, kam smlouva patří.'
  else if (castka === null && castkaPovinna) chyba = 'Zadejte předpis platby v korunách.'
  else if (castka !== null && (!Number.isFinite(castka) || castka <= 0 || castka > 10_000_000)) {
    chyba = 'Zadejte předpis platby v korunách.'
  } else if (!frekvence) chyba = 'Vyberte, jak často se platí.'
  else if (ucetVstup && !ucet) chyba = 'Číslo účtu nevypadá platně – zkontrolujte ho, QR platba by vedla jinam.'
  else if (pocatekVstup && !pocatek) chyba = 'Počátek smlouvy není platné datum.'
  else if (odkaz && !/^https?:\/\/\S+$/i.test(odkaz)) chyba = 'Odkaz musí začínat http:// nebo https://.'
  else if (souborCesta && (!souborCesta.startsWith(`${klientId}/`) || souborCesta.includes('..'))) {
    chyba = 'Soubor se smlouvou je uložený mimo složku klienta.'
  }

  const platba: PlatbaSmlouvy | undefined =
    castka !== null || ucet
      ? {
          ...(ucet ? { ucet } : {}),
          ...(castka !== null ? { castka } : {}),
          ...(vs ? { vs } : {}),
          ...(zprava ? { zprava } : {}),
        }
      : undefined

  return { chyba, nazev, typ, cisloSmlouvy, frekvence, platba, souborCesta, odkaz, pocatek }
}

/** Údaje o produktu u ručně zadané smlouvy; u převedené je bere varianta. */
function udajeOProduktu(body: Record<string, unknown>): Partial<ObsahSmlouvy> {
  const pole = {
    spolecnost: text(body.spolecnost, 120),
    produkt: text(body.produkt, 120),
    popis: text(body.popis, 1000),
    doVeku: text(body.doVeku, 60),
    hlaseni: text(body.hlaseni, 200),
    kontakt: text(body.kontakt, 200),
  }
  const polozkyKryti = body.typ === 'insurance' ? ocistiPolozkyKryti(body.polozkyKryti) : []
  return {
    ...Object.fromEntries(Object.entries(pole).filter(([, v]) => v)),
    ...(polozkyKryti.length > 0 ? { polozkyKryti } : {}),
  }
}

export async function POST(request: Request) {
  try {
    if (!(await overPoradce())) return NextResponse.json({ error: 'Nemáte oprávnění.' }, { status: 401 })

    const body = await request.json().catch(() => null)
    const klientId = body?.client_id
    const variantaId = body?.variant_id
    if (typeof klientId !== 'string' || !UUID.test(klientId)) {
      return NextResponse.json({ error: 'Neplatný klient.' }, { status: 400 })
    }
    if (variantaId !== undefined && (typeof variantaId !== 'string' || !UUID.test(variantaId))) {
      return NextResponse.json({ error: 'Neplatná varianta.' }, { status: 400 })
    }

    const admin = createAdminClient()
    const zVarianty = typeof variantaId === 'string'
    const u = udajeZPodpisu(body, klientId, zVarianty)
    if (u.chyba || !u.typ || !u.frekvence) {
      return NextResponse.json({ error: u.chyba ?? 'Neplatné údaje.' }, { status: 400 })
    }

    let obsah: ObsahSmlouvy
    if (zVarianty) {
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
      obsah = obsahZVarianty(varianta, {
        cisloSmlouvy: u.cisloSmlouvy,
        frekvence: u.frekvence,
        platba: u.platba ?? {},
      })
    } else {
      const produkt = udajeOProduktu(body)
      if (!produkt.spolecnost && !produkt.produkt) {
        return NextResponse.json({ error: 'Vyplňte společnost nebo produkt.' }, { status: 400 })
      }
      obsah = {
        ...produkt,
        ...(u.cisloSmlouvy ? { cisloSmlouvy: u.cisloSmlouvy } : {}),
        frekvence: u.frekvence,
        ...(u.platba ? { platba: u.platba } : {}),
      }
    }
    if (u.pocatek) obsah.pocatek = u.pocatek

    const { data: smlouva, error } = await admin
      .from('proposals')
      .insert({
        client_id: klientId,
        type: u.typ,
        title: u.nazev,
        content: JSON.stringify(obsah),
        file_url: u.souborCesta || null,
        link_url: u.odkaz || null,
      })
      .select('id')
      .single()

    if (error || !smlouva) {
      console.error('[smlouvy] zápis selhal:', error?.message)
      return NextResponse.json({ error: 'Smlouvu se nepodařilo uložit.' }, { status: 500 })
    }

    // E-mail klientovi až po odpovědi – poradce nečeká, než n8n převezme zprávu.
    after(() => upozornitKlienta('nova_smlouva', klientId, { smlouvaId: smlouva.id, nazev: u.nazev }))
    return NextResponse.json({ ok: true, id: smlouva.id })
  } catch (err) {
    console.error('[smlouvy] chyba:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Nastala neočekávaná chyba.' }, { status: 500 })
  }
}

/**
 * Úprava smlouvy. U převedené z varianty se mění jen údaje z podpisu (produkt
 * a krytí zůstávají, jak byly převzaty); u ruční i produkt a krytí.
 * `ukonceno` (RRRR-MM-DD, nebo null) smlouvu ukončí či obnoví.
 */
export async function PATCH(request: Request) {
  try {
    if (!(await overPoradce())) return NextResponse.json({ error: 'Nemáte oprávnění.' }, { status: 401 })

    const body = await request.json().catch(() => null)
    const id = body?.id
    if (typeof id !== 'string' || !UUID.test(id)) {
      return NextResponse.json({ error: 'Neplatná smlouva.' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data: radek } = await admin
      .from('proposals')
      .select('id, client_id, content, file_url')
      .eq('id', id)
      .maybeSingle()
    if (!radek) return NextResponse.json({ error: 'Smlouva neexistuje.' }, { status: 404 })

    const puvodni = ctiSmlouvu(radek.content)
    if (!puvodni) {
      return NextResponse.json({ error: 'Starší návrh ve starém tvaru upravit nejde – založte ho znovu.' }, { status: 400 })
    }

    // Jen ukončení nebo obnovení – zbytek smlouvy zůstává.
    if (Object.keys(body).every((k) => k === 'id' || k === 'ukonceno')) {
      const ukonceno = body.ukonceno === null ? null : platneDatum(body.ukonceno)
      if (body.ukonceno !== null && !ukonceno) {
        return NextResponse.json({ error: 'Datum ukončení není platné.' }, { status: 400 })
      }
      const { ukonceno: _stare, ...zbytek } = puvodni
      const obsah: ObsahSmlouvy = ukonceno ? { ...zbytek, ukonceno } : zbytek
      const { error } = await admin.from('proposals').update({ content: JSON.stringify(obsah) }).eq('id', id)
      if (error) {
        console.error('[smlouvy] ukončení selhalo:', error.message)
        return NextResponse.json({ error: 'Změnu se nepodařilo uložit.' }, { status: 500 })
      }
      return NextResponse.json({ ok: true })
    }

    const zVarianty = Boolean(puvodni.zVarianty)
    const u = udajeZPodpisu(body, radek.client_id, zVarianty)
    if (u.chyba || !u.typ || !u.frekvence) {
      return NextResponse.json({ error: u.chyba ?? 'Neplatné údaje.' }, { status: 400 })
    }

    const produkt = zVarianty
      ? {
          spolecnost: puvodni.spolecnost,
          produkt: puvodni.produkt,
          popis: puvodni.popis,
          doVeku: puvodni.doVeku,
          hlaseni: puvodni.hlaseni,
          kontakt: puvodni.kontakt,
          kryti: puvodni.kryti,
        }
      : udajeOProduktu(body)
    if (!zVarianty && !produkt.spolecnost && !produkt.produkt) {
      return NextResponse.json({ error: 'Vyplňte společnost nebo produkt.' }, { status: 400 })
    }

    const obsah: ObsahSmlouvy = JSON.parse(
      JSON.stringify({
        ...produkt,
        cisloSmlouvy: u.cisloSmlouvy || undefined,
        frekvence: u.frekvence,
        platba: u.platba,
        souborPopisek: puvodni.souborPopisek,
        zVarianty: puvodni.zVarianty,
        pocatek: u.pocatek ?? undefined,
        ukonceno: puvodni.ukonceno,
      }),
    )

    // Nový soubor nahradí starý – ten ve storage nenecháme viset.
    const novySoubor = u.souborCesta || null
    const staryKSmazani = novySoubor && radek.file_url && radek.file_url !== novySoubor ? radek.file_url : null

    const { error } = await admin
      .from('proposals')
      .update({
        type: u.typ,
        title: u.nazev,
        content: JSON.stringify(obsah),
        file_url: novySoubor ?? radek.file_url,
        link_url: u.odkaz || null,
      })
      .eq('id', id)
    if (error) {
      console.error('[smlouvy] úprava selhala:', error.message)
      return NextResponse.json({ error: 'Smlouvu se nepodařilo uložit.' }, { status: 500 })
    }
    if (staryKSmazani) await admin.storage.from('proposals').remove([staryKSmazani])

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[smlouvy] chyba:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Nastala neočekávaná chyba.' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    if (!(await overPoradce())) return NextResponse.json({ error: 'Nemáte oprávnění.' }, { status: 401 })

    const body = await request.json().catch(() => null)
    const id = body?.id
    if (typeof id !== 'string' || !UUID.test(id)) {
      return NextResponse.json({ error: 'Neplatná smlouva.' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data: radek } = await admin.from('proposals').select('id, file_url').eq('id', id).maybeSingle()
    if (!radek) return NextResponse.json({ error: 'Smlouva neexistuje.' }, { status: 404 })

    const { error } = await admin.from('proposals').delete().eq('id', id)
    if (error) {
      console.error('[smlouvy] smazání selhalo:', error.message)
      return NextResponse.json({ error: 'Smlouvu se nepodařilo smazat.' }, { status: 500 })
    }
    if (radek.file_url) await admin.storage.from('proposals').remove([radek.file_url])

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[smlouvy] chyba:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Nastala neočekávaná chyba.' }, { status: 500 })
  }
}
