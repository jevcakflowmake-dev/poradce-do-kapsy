import type { SupabaseClient } from '@supabase/supabase-js'

/** Max velikost přílohy – Supabase free tier má limit 50 MB/soubor, držíme se níž. */
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

/** Přílohy analýzy: smlouvy a výpisy v PDF, fotky dokladů. Totéž jako `accept` u pole. */
export const PRIJIMANE_PRILOHY = '.pdf,.jpg,.jpeg,.png'
const POVOLENE_TYPY = ['application/pdf', 'image/jpeg', 'image/png']

/**
 * `accept` u pole hlídá jen prohlížeč, obejít ho jde jedním požadavkem.
 * Tohle je kontrola, která platí: poradce pak neotevře cizí .exe ani
 * HTML stránku vydávanou za přílohu.
 */
export function jePovolenaPriloha(file: { name: string; type: string }): boolean {
  const jmeno = file.name.toLowerCase()
  const pripona = PRIJIMANE_PRILOHY.split(',').some((p) => jmeno.endsWith(p))
  // Prázdný typ posílají některé prohlížeče u neznámých souborů – pak rozhodne přípona.
  return pripona && (!file.type || POVOLENE_TYPY.includes(file.type))
}

/** Diakritika a mezery pryč – bezpečný název souboru do storage cesty. */
export function sanitizeFileName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(-80)
}

export type AnalysisUploadResult =
  | { ok: true; path: string }
  | { ok: false; error: string }

/**
 * Nahraje přílohu analýzy do privátního bucketu `analysis` a zapíše řádek
 * do `analysis_files`. Do file_url se ukládá STORAGE CESTA (ne URL) –
 * odkaz se vždy generuje přes createSignedUrl.
 */
export async function uploadAnalysisFile(
  supabase: SupabaseClient,
  clientId: string,
  section: string,
  file: File,
): Promise<AnalysisUploadResult> {
  if (file.size > MAX_FILE_SIZE) {
    return { ok: false, error: `${file.name}: soubor je větší než 10 MB` }
  }
  if (!jePovolenaPriloha(file)) {
    return { ok: false, error: `${file.name}: nahrát jde jen PDF, JPG nebo PNG` }
  }

  const path = `${clientId}/${section}/${Date.now()}_${sanitizeFileName(file.name)}`

  const { error: uploadError } = await supabase.storage.from('analysis').upload(path, file)
  if (uploadError) {
    return { ok: false, error: `${file.name}: ${uploadError.message}` }
  }

  const { error: insertError } = await supabase.from('analysis_files').insert({
    client_id: clientId,
    section,
    file_name: file.name,
    file_url: path,
    file_size: file.size,
  })
  if (insertError) {
    // Uklidit osiřelý soubor, ať se v bucketu nehromadí
    await supabase.storage.from('analysis').remove([path])
    return { ok: false, error: `${file.name}: ${insertError.message}` }
  }

  return { ok: true, path }
}
