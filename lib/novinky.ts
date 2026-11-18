import 'server-only'
import { createPublicClient } from '@/lib/supabase/verejny'

/**
 * Novinky z finančního světa – krátké články na /novinky (tabulka novinky,
 * migrace 022). Píše je n8n s pomocí AI, Jakub je schvaluje e-mailem
 * a schválené posílá n8n na POST /api/novinky. Šablona workflow je v n8n/.
 *
 * Obsah je prostý text: odstavce oddělené prázdným řádkem, nadpis začíná
 * „## “ a odrážka „- “. HTML se neukládá ani nevykresluje, takže ani
 * nepovedený výstup AI nemůže do stránky nic podstrčit.
 */

export interface Zdroj {
  nazev: string
  url: string
}

export interface Novinka {
  slug: string
  titulek: string
  perex: string
  obsah: string
  zdroje: Zdroj[]
  zverejneno_at: string
}

export type Blok =
  | { typ: 'nadpis'; text: string }
  | { typ: 'odstavec'; text: string }
  | { typ: 'seznam'; polozky: string[] }

export const LIMITY = { titulek: 160, perex: 600, obsah: 30000, zdroju: 10 } as const

const SLOUPCE = 'slug, titulek, perex, obsah, zdroje, zverejneno_at'

function zdrojeZJson(hodnota: unknown): Zdroj[] {
  if (!Array.isArray(hodnota)) return []
  return hodnota
    .filter((z): z is Zdroj => typeof z?.nazev === 'string' && typeof z?.url === 'string' && /^https?:\/\//.test(z.url))
    .slice(0, LIMITY.zdroju)
}

/** Řádek z databáze → Novinka. Zdroje jsou JSON, tak je kontrolujeme i při čtení. */
function zRadku(r: { slug: string; titulek: string; perex: string; obsah: string; zdroje: unknown; zverejneno_at: string | null }): Novinka {
  return { ...r, zdroje: zdrojeZJson(r.zdroje), zverejneno_at: r.zverejneno_at ?? '' }
}

/**
 * Zveřejněné novinky od nejnovější. Čte se veřejným klíčem bez session –
 * RLS pustí jen zveřejněné a stránky tak můžou být statické.
 */
export async function nactiNovinky(limit = 50): Promise<Novinka[]> {
  const { data, error } = await createPublicClient()
    .from('novinky')
    .select(SLOUPCE)
    .order('zverejneno_at', { ascending: false })
    .limit(limit)
  if (error) {
    console.error('[novinky] načtení selhalo:', error.message)
    return []
  }
  return (data ?? []).map(zRadku)
}

export async function nactiNovinku(slug: string): Promise<Novinka | null> {
  if (!/^[a-z0-9-]{1,120}$/.test(slug)) return null
  const { data } = await createPublicClient().from('novinky').select(SLOUPCE).eq('slug', slug).maybeSingle()
  return data ? zRadku(data) : null
}

/** Adresa článku z nadpisu: bez diakritiky, malými písmeny, slova spojená pomlčkou. */
export function slugZNadpisu(titulek: string): string {
  return titulek
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '')
}

/** Prostý text článku na bloky (nadpisy, odstavce, odrážky). */
export function rozdelObsah(obsah: string): Blok[] {
  const bloky: Blok[] = []
  const odrazka = /^[-•*]\s+/
  const nadpis = /^#{2,3}\s+/
  for (const kus of obsah.replace(/\r\n?/g, '\n').split(/\n\s*\n/)) {
    const radky = kus.split('\n').map((r) => r.trim()).filter(Boolean)
    // Blok jde po řádcích: nadpis, souvislý text a odrážky. AI často píše
    // „Zaměřte se na:“ a odrážky hned pod tím bez prázdného řádku – dřív se
    // celý blok slil do jednoho odstavce s pomlčkami.
    let text: string[] = []
    let seznam: string[] = []
    const uzavri = () => {
      if (text.length) bloky.push({ typ: 'odstavec', text: text.join(' ') })
      if (seznam.length) bloky.push({ typ: 'seznam', polozky: seznam })
      text = []
      seznam = []
    }
    for (const radek of radky) {
      if (nadpis.test(radek)) {
        uzavri()
        bloky.push({ typ: 'nadpis', text: radek.replace(nadpis, '') })
      } else if (odrazka.test(radek)) {
        if (text.length) {
          bloky.push({ typ: 'odstavec', text: text.join(' ') })
          text = []
        }
        seznam.push(radek.replace(odrazka, ''))
      } else if (seznam.length) {
        // Pokračování odrážky na dalším řádku.
        seznam[seznam.length - 1] += ` ${radek}`
      } else {
        text.push(radek)
      }
    }
    uzavri()
  }
  return bloky
}

/**
 * Pevné mezery, aby se „4 %“, „250 Kč“ nebo „v roce“ nerozdělily na konci
 * řádku. Texty článků píše AI a ukládají se jako prostý text, proto až při
 * vykreslení.
 */
export function svazMezery(text: string): string {
  return text
    .replace(/(\d)\s+(%|Kč|let|roků|roky|rok|měsíců|měsíce|dní|tis\.|mil\.|mld\.)(?=[\s.,;:!?)]|$)/g, '$1\u00a0$2')
    // Lookbehind místo zachycení: „a v roce“ má svázat obě předložky.
    .replace(/(?<=^|[\s(„])([ksvzouaiKSVZOUAI])\s+/g, '$1\u00a0')
}

/** „21. října 2026“ – pevně pražský čas, server běží v UTC. */
export function datumNovinky(iso: string): string {
  return new Date(iso).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Prague' })
}

/** Odhad délky čtení – 200 slov za minutu, aspoň minuta. */
export function minutCteni(novinka: Pick<Novinka, 'perex' | 'obsah'>): number {
  const slov = `${novinka.perex} ${novinka.obsah}`.split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(slov / 200))
}

/**
 * Kontrola článku z n8n. Vrací očištěný článek, nebo text chyby pro odpověď.
 * Zdroje bez platné adresy se tiše vynechají – článek kvůli nim neodmítáme.
 */
export function ocistiNovinku(telo: unknown):
  | { ok: true; novinka: { titulek: string; perex: string; obsah: string; zdroje: Zdroj[] } }
  | { ok: false; chyba: string } {
  const t = (telo ?? {}) as Record<string, unknown>
  const text = (hodnota: unknown) => (typeof hodnota === 'string' ? hodnota.trim() : '')
  const titulek = text(t.titulek)
  const perex = text(t.perex)
  const obsah = text(t.obsah)
  if (!titulek || !perex || !obsah) return { ok: false, chyba: 'Chybí titulek, perex nebo obsah.' }
  if (titulek.length > LIMITY.titulek) return { ok: false, chyba: `Titulek má víc než ${LIMITY.titulek} znaků.` }
  if (perex.length > LIMITY.perex) return { ok: false, chyba: `Perex má víc než ${LIMITY.perex} znaků.` }
  if (obsah.length > LIMITY.obsah) return { ok: false, chyba: `Obsah má víc než ${LIMITY.obsah} znaků.` }
  if (!slugZNadpisu(titulek)) return { ok: false, chyba: 'Z titulku nejde složit adresu článku.' }
  return { ok: true, novinka: { titulek, perex, obsah, zdroje: zdrojeZJson(t.zdroje) } }
}
