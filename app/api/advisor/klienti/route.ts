import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { PARKED_PREFIX, STORAGE_BUCKET } from '@/lib/submissions'
import { absoluteUrl } from '@/lib/site'

/**
 * Klienti, které poradce zakládá a maže sám.
 *
 * POST založí účet klienta bez hesla – typicky pro stávající klienty, kteří
 * se neregistrovali sami. S `pozvat: true` mu rovnou odejde pozvánka
 * (šablona Supabase „Invite user“, supabase/templates/pozvanka.html), jinak
 * mu poradce přístup pošle později z detailu klienta.
 *
 * DELETE klienta smaže úplně (právo na výmaz): soubory z analýzy i smlouvy,
 * rozepsané analýzy, podání z veřejného formuláře a nakonec účet – ten
 * kaskádou odklidí profil a všechny navázané tabulky. Nevratné.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

async function overPoradce() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user && user.app_metadata?.role === 'advisor' ? user : null
}

export async function POST(request: Request) {
  try {
    if (!(await overPoradce())) return NextResponse.json({ error: 'Nemáte oprávnění.' }, { status: 401 })

    const body = await request.json().catch(() => null)
    const jmeno = typeof body?.full_name === 'string' ? body.full_name.trim().slice(0, 100) : ''
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase().slice(0, 200) : ''
    const telefon = typeof body?.phone === 'string' ? body.phone.trim().slice(0, 30) : ''
    if (jmeno.length < 2) return NextResponse.json({ error: 'Vyplňte jméno a příjmení.' }, { status: 400 })
    if (!EMAIL.test(email)) return NextResponse.json({ error: 'Zadejte platný e-mail.' }, { status: 400 })
    if (telefon && telefon.replace(/\D/g, '').length < 9) {
      return NextResponse.json({ error: 'Telefonní číslo musí mít aspoň 9 číslic.' }, { status: 400 })
    }

    const pozvat = body?.pozvat === true
    const metadata = { full_name: jmeno, ...(telefon ? { phone: telefon } : {}) }
    // role patří do app_metadata – do user_metadata si zapíše uživatel sám
    const appMetadata = { role: 'client', zalozil_poradce: true }

    const admin = createAdminClient()
    // Pozvánka účet rovnou založí; když e-mail neodejde, Supabase založení vrátí.
    const { data, error } = pozvat
      ? await admin.auth.admin.inviteUserByEmail(email, { data: metadata, redirectTo: absoluteUrl('/update-password') })
      : await admin.auth.admin.createUser({
          email,
          // Bez hesla se přihlásit nedá; potvrzený je proto, aby šel poslat přístup
          // (odkaz na nastavení hesla) – stejně jako u veřejné analýzy bez hesla.
          email_confirm: true,
          user_metadata: metadata,
          app_metadata: appMetadata,
        })
    if (error || !data.user) {
      if (error?.code === 'email_exists' || error?.status === 422) {
        return NextResponse.json({ error: 'Účet s tímhle e-mailem už v aplikaci je – klienta najdete v seznamu.' }, { status: 409 })
      }
      console.error('[klienti] založení selhalo:', error?.message)
      return NextResponse.json(
        { error: pozvat ? 'Pozvánka neodešla, takže se klient nezaložil. Zkuste to znovu, nebo ho založte bez pozvánky.' : 'Klienta se nepodařilo založit.' },
        { status: 500 },
      )
    }

    const id = data.user.id
    if (pozvat) {
      // Pozvánka app_metadata nastavit neumí. Do té doby je účet bez role,
      // tedy obyčejný klient – nic navíc nesmí.
      const { error: chybaRole } = await admin.auth.admin.updateUserById(id, { app_metadata: appMetadata })
      if (chybaRole) console.error('[klienti] role po pozvánce:', chybaRole.message)
    }
    // Profil zakládá trigger jen se jménem; telefon doplníme.
    if (telefon) await admin.from('profiles').update({ phone: telefon }).eq('id', id)
    return NextResponse.json({ ok: true, id, pozvan: pozvat })
  } catch (err) {
    console.error('[klienti] chyba:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Nastala neočekávaná chyba.' }, { status: 500 })
  }
}

/** Smaže všechny soubory pod prefixem (složky ve storage jsou jen cesty). */
async function smazSlozku(admin: SupabaseClient, bucket: string, prefix: string, hloubka = 3): Promise<void> {
  const { data } = await admin.storage.from(bucket).list(prefix, { limit: 1000 })
  const soubory: string[] = []
  const slozky: string[] = []
  for (const polozka of data ?? []) (polozka.id ? soubory : slozky).push(`${prefix}/${polozka.name}`)
  if (soubory.length > 0) await admin.storage.from(bucket).remove(soubory)
  if (hloubka > 0) for (const slozka of slozky) await smazSlozku(admin, bucket, slozka, hloubka - 1)
}

export async function DELETE(request: Request) {
  try {
    const poradce = await overPoradce()
    if (!poradce) return NextResponse.json({ error: 'Nemáte oprávnění.' }, { status: 401 })

    const body = await request.json().catch(() => null)
    const klientId = body?.client_id
    if (typeof klientId !== 'string' || !UUID.test(klientId)) {
      return NextResponse.json({ error: 'Neplatný klient.' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data: ucet } = await admin.auth.admin.getUserById(klientId)
    if (!ucet?.user) return NextResponse.json({ error: 'Klient neexistuje.' }, { status: 404 })
    if (ucet.user.app_metadata?.role === 'advisor' || klientId === poradce.id) {
      return NextResponse.json({ error: 'Účet poradce se tady smazat nedá.' }, { status: 400 })
    }
    const email = ucet.user.email?.toLowerCase() ?? null

    // ilike bere _ a % jako zástupné znaky (jan_novak by chytil i jan.novak),
    // takže vybírá jen kandidáty a maže se až po přesném porovnání.
    const stejnyEmail = (e: string | null) => Boolean(email && e?.trim().toLowerCase() === email)
    const [{ data: podaniKlienta }, { data: podaniEmail }, { data: koncepty }] = await Promise.all([
      admin.from('public_submissions').select('id').eq('matched_client_id', klientId),
      // Podání z veřejného formuláře se stejným e-mailem, i když k účtu nepřiřazená.
      email ? admin.from('public_submissions').select('id, email').ilike('email', email) : { data: [] },
      // Rozepsané analýzy nejsou navázané na účet, jen na e-mail.
      email ? admin.from('analysis_drafts').select('id, email').ilike('email', email) : { data: [] },
    ])
    const idPodani = [
      ...new Set([
        ...(podaniKlienta ?? []).map((p) => p.id as string),
        ...(podaniEmail ?? []).filter((p) => stejnyEmail(p.email)).map((p) => p.id as string),
      ]),
    ]
    const idKonceptu = (koncepty ?? []).filter((k) => stejnyEmail(k.email)).map((k) => k.id as string)

    for (const id of idPodani) await smazSlozku(admin, STORAGE_BUCKET, `${PARKED_PREFIX}/${id}`)
    if (idPodani.length) await admin.from('public_submissions').delete().in('id', idPodani)
    if (idKonceptu.length) await admin.from('analysis_drafts').delete().in('id', idKonceptu)
    await smazSlozku(admin, STORAGE_BUCKET, klientId)
    await smazSlozku(admin, 'proposals', klientId)

    const { error } = await admin.auth.admin.deleteUser(klientId)
    if (error) {
      console.error('[klienti] smazání účtu selhalo:', error.message)
      return NextResponse.json({ error: 'Účet se nepodařilo smazat. Soubory už jsou pryč, zkuste to prosím znovu.' }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[klienti] chyba:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Nastala neočekávaná chyba.' }, { status: 500 })
  }
}
