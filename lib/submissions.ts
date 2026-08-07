import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Práce s odesláními z veřejného formuláře (/analyza).
 *
 * Sdílí to server route, která formulář přijímá, i akce poradce, který
 * čekající odeslání schvaluje — obojí musí odpovědi překlopit ke klientovi
 * úplně stejně, jinak by se data rozešla.
 *
 * Všechny funkce čekají admin (service role) klienta — běží mimo RLS.
 * Importovat výhradně ze server routes; do klientské komponenty tenhle
 * modul nesmí, jinak by se service-role logika dostala do bundlu.
 */

export type Responses = Record<string, Record<string, string>>

export interface SubmissionFile {
  section: string
  file_name: string
  file_url: string
  file_size: number
}

export const STORAGE_BUCKET = 'analysis'
/** Složka, kde parkují přílohy odeslání, které ještě nemá klienta. */
export const PARKED_PREFIX = 'submissions'

/**
 * Zapíše odpovědi k danému klientovi. Existující hodnotu přepisuje —
 * volá se buď u čerstvě založeného klienta (kde není co přepsat), nebo
 * po vědomém schválení poradcem.
 */
export async function applyResponses(
  admin: SupabaseClient,
  clientId: string,
  responses: Responses,
): Promise<void> {
  const rows: Array<{
    client_id: string
    section: string
    question_id: string
    value: string
    updated_at: string
  }> = []

  const now = new Date().toISOString()
  for (const [section, questions] of Object.entries(responses)) {
    for (const [question_id, value] of Object.entries(questions)) {
      if (!value) continue
      rows.push({ client_id: clientId, section, question_id, value, updated_at: now })
    }
  }

  if (rows.length === 0) return

  // Jeden upsert místo smyčky s desítkami round-tripů (analýza má ~50 otázek).
  const { error } = await admin
    .from('analysis_responses')
    .upsert(rows, { onConflict: 'client_id,section,question_id' })

  if (error) throw new Error(`Uložení odpovědí selhalo: ${error.message}`)
}

/**
 * Přenese jméno, telefon, věk a příjem z analýzy do profilu, aby je poradce
 * viděl v seznamu klientů. Nikdy nepřepisuje vyplněné pole prázdnou hodnotou.
 *
 * Zároveň označí analýzu za vyplněnou — kdo prošel veřejným formulářem, už
 * nemá být znovu posílán do úvodního wizardu na /onboarding.
 */
export async function syncProfileFromResponses(
  admin: SupabaseClient,
  clientId: string,
  responses: Responses,
): Promise<void> {
  const personal = responses.personal
  const income = responses.income

  const updates: Record<string, unknown> = {
    onboarding_completed: true,
    // `goals` drží ID vyplněných sekcí — stejně jako verze pro přihlášené.
    goals: Object.keys(responses),
    updated_at: new Date().toISOString(),
  }
  if (personal?.full_name) updates.full_name = personal.full_name
  if (personal?.phone) updates.phone = personal.phone
  if (personal?.age) {
    const age = parseInt(personal.age, 10)
    if (Number.isFinite(age)) updates.age = age
  }
  if (income?.monthly_income) updates.income = income.monthly_income

  await admin.from('profiles').update(updates).eq('id', clientId)
}

/**
 * Přesune zaparkované přílohy ze `submissions/{id}/…` do `{client_id}/…`
 * a zaeviduje je v analysis_files. Bez přesunu by je klient neotevřel —
 * storage policy pouští ke čtení jen složku pojmenovanou jeho auth.uid().
 *
 * Vrací soubory, které se přesunout nepodařilo; volající je má zalogovat.
 * Selhání jednoho souboru nesmí shodit celé překlopení odpovědí.
 */
export async function attachFilesToClient(
  admin: SupabaseClient,
  clientId: string,
  files: SubmissionFile[],
): Promise<SubmissionFile[]> {
  const failed: SubmissionFile[] = []

  for (const file of files) {
    let path = file.file_url

    if (path.startsWith(`${PARKED_PREFIX}/`)) {
      const target = `${clientId}/${file.section}/${path.split('/').pop()}`
      const { error } = await admin.storage.from(STORAGE_BUCKET).move(path, target)
      if (error) {
        failed.push(file)
        continue
      }
      path = target
    }

    const { error: insertError } = await admin.from('analysis_files').insert({
      client_id: clientId,
      section: file.section,
      file_name: file.file_name,
      file_url: path,
      file_size: file.file_size,
    })
    if (insertError) failed.push(file)
  }

  return failed
}

/** Najde uživatele podle e-mailu. Vrací null, když takový účet neexistuje. */
export async function findUserByEmail(
  admin: SupabaseClient,
  email: string,
): Promise<{ id: string } | null> {
  const needle = email.trim().toLowerCase()

  // listUsers stránkuje po 50; procházíme, dokud se e-mail nenajde.
  for (let page = 1; page <= 40; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (error || !data?.users?.length) return null

    const found = data.users.find(u => u.email?.toLowerCase() === needle)
    if (found) return { id: found.id }

    if (data.users.length < 200) return null
  }
  return null
}
