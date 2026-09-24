import type { SupabaseClient } from '@supabase/supabase-js'
import { SECTIONS, uklidVsechnySekce, type VsechnyOdpovedi } from './analysis-sections'

/**
 * Práce s odesláními z veřejného formuláře (/analyza).
 *
 * Sdílí to server route, která formulář přijímá, i akce poradce, který
 * čekající odeslání schvaluje – obojí musí odpovědi překlopit ke klientovi
 * úplně stejně, jinak by se data rozešla.
 *
 * Všechny funkce čekají admin (service role) klienta – běží mimo RLS.
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

/** Nejdelší hodnota jedné odpovědi. Víc nenapíše ani poznámka. */
export const MAX_DELKA_ODPOVEDI = 2000

/** Povolené dvojice sekce/otázka – vše ostatní ze vstupu zahodíme. */
const POVOLENE_OTAZKY = new Map(SECTIONS.map((s) => [s.id, new Set(s.questions.map((q) => q.id))]))

/** Sekce analýzy – jen tyhle smějí být i ve jménu složky s přílohou. */
export const SEKCE_ANALYZY = new Set(SECTIONS.map((s) => s.id))

/**
 * Nechá jen otázky, které analýza opravdu má, jen textové hodnoty a ty
 * zkrátí na MAX_DELKA_ODPOVEDI. Vstup z prohlížeče je cizí data – veřejná
 * analýza i přihlášený klient mohou poslat cokoliv, třeba číslo místo
 * textu nebo megabajt do jedné odpovědi.
 *
 * `prazdne` ponechá vymazané odpovědi jako '' – podle nich
 * `odstranNeplatneOdpovedi` pozná, že je klient smazal.
 */
export function ocistiOdpovedi(raw: unknown, { prazdne = false }: { prazdne?: boolean } = {}): Responses {
  const cisto: Responses = {}
  if (!raw || typeof raw !== 'object') return cisto

  for (const [sekceId, otazky] of Object.entries(raw as Record<string, unknown>)) {
    const povolene = POVOLENE_OTAZKY.get(sekceId)
    if (!povolene || !otazky || typeof otazky !== 'object') continue

    for (const [otazkaId, hodnota] of Object.entries(otazky as Record<string, unknown>)) {
      if (!povolene.has(otazkaId) || typeof hodnota !== 'string') continue
      const text = hodnota.trim()
      if (!text && !prazdne) continue
      ;(cisto[sekceId] ??= {})[otazkaId] = text.slice(0, MAX_DELKA_ODPOVEDI)
    }
  }
  return cisto
}

/**
 * Zapíše odpovědi k danému klientovi. Existující hodnotu přepisuje –
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
 * Smaže odpovědi, které podle definice analýzy nemají existovat: schované
 * podmínkou (OSVČ → zaměstnanec, „jen úraz“) a vymazané klientem.
 *
 * `applyResponses` jen přepisuje a prázdné hodnoty přeskakuje, takže se
 * z databáze dřív nikdy nic nesmazalo. Úklid v prohlížeči odpověď vyhodil
 * jen ze stavu formuláře – kdo po uložení přepnul větev, tomu stará odpověď
 * v databázi zůstala a poradce z ní dál viděl flagy.
 *
 * Odpovědi na otázky, které definice nezná (starší verze analýzy), nechává
 * být: panel poradce je schválně neukazuje, ale mazat je není důvod.
 */
export async function odstranNeplatneOdpovedi(
  admin: SupabaseClient,
  clientId: string,
  odeslane?: Responses,
): Promise<number> {
  const { data, error } = await admin
    .from('analysis_responses')
    .select('section, question_id, value')
    .eq('client_id', clientId)
  if (error) throw new Error(`Načtení odpovědí selhalo: ${error.message}`)

  const vsechny: VsechnyOdpovedi = {}
  for (const r of (data ?? []) as Array<{ section: string; question_id: string; value: string }>) {
    ;(vsechny[r.section] ??= {})[r.question_id] = r.value
  }
  const platne = uklidVsechnySekce(vsechny)

  const kSmazani: Record<string, string[]> = {}
  for (const sekce of SECTIONS) {
    const definovane = new Set(sekce.questions.map((q) => q.id))
    for (const qid of Object.keys(vsechny[sekce.id] ?? {})) {
      if (!definovane.has(qid)) continue
      const skryta = platne[sekce.id]?.[qid] === undefined
      const vymazana = odeslane?.[sekce.id]?.[qid] !== undefined && !odeslane[sekce.id][qid].trim()
      if (skryta || vymazana) (kSmazani[sekce.id] ??= []).push(qid)
    }
  }

  let pocet = 0
  for (const [sekce, otazky] of Object.entries(kSmazani)) {
    const { error: chyba } = await admin
      .from('analysis_responses')
      .delete()
      .eq('client_id', clientId)
      .eq('section', sekce)
      .in('question_id', otazky)
    if (chyba) throw new Error(`Úklid odpovědí selhal: ${chyba.message}`)
    pocet += otazky.length
  }
  return pocet
}

/**
 * Rodinná situace z analýzy → hodnota sloupce `profiles.family_status`.
 * Popisky musí souhlasit s familyLabel() v lib/utils.ts.
 */
const FAMILY_STATUS_MAP: Record<string, string> = {
  'Bez partnera a dětí': 'single',
  'S partnerem/partnerkou': 'partner',
  'Rodina s dětmi': 'family',
  'Samoživitel/samoživitelka': 'single_parent',
  // Znění do 24. 9. 2026 – tak jsou uložené starší odpovědi a rozepsané analýzy.
  'Single': 'single',
  'S partnerem/kou': 'partner',
  'Samoživitel/ka': 'single_parent',
}

/**
 * Tolerance k riziku ze sekce Investice → `profiles.risk_profile`.
 *
 * POZOR: klíče musí doslova odpovídat volbám otázky `risk_tolerance`
 * v lib/analysis-sections.ts. Když se tam přepíšou a sem se to nepromítne,
 * profil se tiše přestane plnit – a `risk_profile` je 20 bodů ze 100
 * ve skóre finančního zdraví a sloupec v seznamu klientů.
 *
 * Stupnice je conservative < moderate < balanced < aggressive; popisky
 * pro poradce dělá riskLabel() v lib/utils.ts.
 */
const RISK_PROFILE_MAP: Record<string, string> = {
  // současné znění voleb
  'Nechci ztrátu, i za cenu nižšího výnosu': 'conservative',
  'Menší výkyvy snesu': 'moderate',
  'Počítám s výkyvy kvůli vyššímu výnosu': 'balanced',
  'Výkyvy mi nevadí, jdu za výnosem': 'aggressive',
  // znění do 22. 9. 2026 – kvůli dřív vyplněným analýzám
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
   * Označit analýzu za dokončenou. Jen při vědomém odeslání – průběžné
   * ukládání na /api/analysis se volá po každých pár znacích a rozepsaná
   * analýza dokončená není.
   */
  markCompleted = false,
): Promise<void> {
  const personal = responses.personal
  const income = responses.income
  const investing = responses.investing

  const updates: Record<string, unknown> = {
    // `goals` drží ID vyplněných sekcí – stejně jako verze pro přihlášené.
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
 * a zaeviduje je v analysis_files. Bez přesunu by je klient neotevřel –
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
