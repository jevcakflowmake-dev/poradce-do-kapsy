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
 * Rodinná situace z analýzy → hodnota sloupce `profiles.family_status`.
 * Popisky musí souhlasit s familyLabel() v lib/utils.ts.
 */
const FAMILY_STATUS_MAP: Record<string, string> = {
  'Single': 'single',
  'S partnerem/kou': 'partner',
  'Rodina s dětmi': 'family',
  'Samoživitel/ka': 'single_parent',
}

/**
 * Tolerance k riziku ze sekce Investice → `profiles.risk_profile`.
 * Popisky musí souhlasit s riskLabel() v lib/utils.ts — pozor, „Dynamický“
 * se tam mapuje na `balanced` a „Vyvážený“ na `moderate`.
 */
const RISK_PROFILE_MAP: Record<string, string> = {
  'Konzervativní': 'conservative',
  'Vyvážený': 'moderate',
  'Dynamický': 'balanced',
  'Agresivní': 'aggressive',
}

/**
 * Přenese do profilu údaje, které poradce vidí v seznamu klientů a které
 * vstupují do skóre finančního zdraví. Nikdy nepřepisuje vyplněné pole
 * prázdnou hodnotou.
 *
 * Rodinný stav a rizikový profil sem dřív dodával úvodní wizard na
 * /onboarding. Ten je od 7. 8. 2026 zrušený (kdo přijde přes veřejnou
 * analýzu, má ji rovnou celou vyplněnou), takže se odvozují odsud.
 */
export async function syncProfileFromResponses(
  admin: SupabaseClient,
  clientId: string,
  responses: Responses,
  /**
   * Označit analýzu za dokončenou. Jen při vědomém odeslání — průběžné
   * ukládání na /api/analysis se volá po každých pár znacích a rozepsaná
   * analýza dokončená není.
   */
  markCompleted = false,
): Promise<void> {
  const personal = responses.personal
  const income = responses.income
  const investing = responses.investing

  const updates: Record<string, unknown> = {
    // `goals` drží ID vyplněných sekcí — stejně jako verze pro přihlášené.
    goals: Object.keys(responses),
    updated_at: new Date().toISOString(),
  }
  if (markCompleted) updates.onboarding_completed = true
  if (personal?.full_name) updates.full_name = personal.full_name
  if (personal?.phone) updates.phone = personal.phone
  if (personal?.age) {
    const age = parseInt(personal.age, 10)
    if (Number.isFinite(age)) updates.age = age
  }
  if (income?.monthly_income) updates.income = income.monthly_income

  const family = personal?.family_status && FAMILY_STATUS_MAP[personal.family_status]
  if (family) updates.family_status = family

  const risk = investing?.risk_tolerance && RISK_PROFILE_MAP[investing.risk_tolerance]
  if (risk) updates.risk_profile = risk

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
