import type { SupabaseClient } from '@supabase/supabase-js'

/** Max velikost přílohy – Supabase free tier má limit 50 MB/soubor, držíme se níž. */
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

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
