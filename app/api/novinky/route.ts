import { timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { ocistiNovinku, slugZNadpisu } from '@/lib/novinky'
import { absoluteUrl } from '@/lib/site'

/**
 * Zveřejnění článku v Novinkách. Volá ho n8n, až Jakub článek schválí
 * v e-mailu (šablona workflow v n8n/novinky-clanek.json).
 *
 * Ověřuje se tajným klíčem v hlavičce X-Poradce-Token (N8N_NOVINKY_TOKEN
 * ve Vercelu a Header Auth v n8n). Klíč je jiný než u upozornění klientů:
 * každý směr má svůj, ať jde jeden vyměnit bez druhého.
 *
 * Tělo: { titulek, perex, obsah, zdroje?: [{ nazev, url }] }. Adresu článku
 * složí web z titulku; když už existuje, přidá číslo.
 */
const TOKEN_HLAVICKA = 'x-poradce-token'

function tokenSedi(prijaty: string | null): boolean {
  const ocekavany = process.env.N8N_NOVINKY_TOKEN
  if (!ocekavany || !prijaty) return false
  const a = Buffer.from(prijaty)
  const b = Buffer.from(ocekavany)
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function POST(request: Request) {
  if (!process.env.N8N_NOVINKY_TOKEN) {
    console.error('[novinky] chybí N8N_NOVINKY_TOKEN – článek nejde přijmout')
    return NextResponse.json({ error: 'Příjem článků není nastavený.' }, { status: 503 })
  }
  if (!tokenSedi(request.headers.get(TOKEN_HLAVICKA))) {
    return NextResponse.json({ error: 'Neplatný klíč.' }, { status: 401 })
  }

  const vysledek = ocistiNovinku(await request.json().catch(() => null))
  if (!vysledek.ok) return NextResponse.json({ error: vysledek.chyba }, { status: 400 })
  const { novinka } = vysledek

  const admin = createAdminClient()
  const zaklad = slugZNadpisu(novinka.titulek)
  const { data: obsazene } = await admin.from('novinky').select('slug').like('slug', `${zaklad}%`)
  const pouzite = new Set((obsazene ?? []).map((r) => r.slug))
  let slug = zaklad
  for (let i = 2; pouzite.has(slug); i++) slug = `${zaklad}-${i}`

  const { error } = await admin.from('novinky').insert({
    slug,
    titulek: novinka.titulek,
    perex: novinka.perex,
    obsah: novinka.obsah,
    zdroje: novinka.zdroje.map(({ nazev, url }) => ({ nazev, url })),
    zverejneno_at: new Date().toISOString(),
  })
  if (error) {
    console.error('[novinky] uložení selhalo:', error.message)
    return NextResponse.json({ error: 'Článek se nepodařilo uložit.' }, { status: 500 })
  }

  // Výpis a článek jsou statické – obnoví se při další návštěvě.
  // Úvodní stránka i sitemap se skládají pokaždé, ty není třeba.
  revalidatePath('/novinky')
  revalidatePath(`/novinky/${slug}`)

  return NextResponse.json({ ok: true, slug, url: absoluteUrl(`/novinky/${slug}`) }, { status: 201 })
}
