import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  applyResponses,
  attachFilesToClient,
  findUserByEmail,
  syncProfileFromResponses,
  PARKED_PREFIX,
  STORAGE_BUCKET,
  type Responses,
  type SubmissionFile,
} from '@/lib/submissions'
import { MAX_FILE_SIZE, sanitizeFileName } from '@/lib/storage'
import { SECTIONS } from '@/lib/analysis-sections'
import type { Json } from '@/lib/types/database'

/**
 * Příjem veřejné analýzy z /analyza — jediný endpoint aplikace, který smí
 * volat kdokoliv bez přihlášení. Tomu odpovídá i míra nedůvěry ke vstupu:
 * povolujeme jen otázky, které v analýze opravdu existují, omezujeme délku
 * hodnot, počet i velikost příloh a držíme jednoduchý rate limit.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_VALUE_LENGTH = 2000
const MAX_FILES = 10

/** Povolené dvojice sekce/otázka — vše ostatní z requestu zahodíme. */
const ALLOWED = new Map(SECTIONS.map(s => [s.id, new Set(s.questions.map(q => q.id))]))

/**
 * Rate limit v paměti instance. Na Vercelu běží víc instancí, takže tohle
 * není tvrdá hranice — spíš brzda proti tomu, aby jeden skript zaplavil
 * databázi. Skutečnou ochranu má dělat WAF/Vercel firewall.
 */
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000
const RATE_LIMIT_MAX = 5
const hits = new Map<string, number[]>()

function rateLimited(ip: string): boolean {
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter(t => now - t < RATE_LIMIT_WINDOW_MS)
  recent.push(now)
  hits.set(ip, recent)

  if (hits.size > 5000) hits.clear() // pojistka proti růstu paměti
  return recent.length > RATE_LIMIT_MAX
}

/** Vyhodí neznámé sekce/otázky a ořízne příliš dlouhé hodnoty. */
function sanitizeResponses(raw: unknown): Responses {
  const clean: Responses = {}
  if (!raw || typeof raw !== 'object') return clean

  for (const [sectionId, questions] of Object.entries(raw as Record<string, unknown>)) {
    const allowedQuestions = ALLOWED.get(sectionId)
    if (!allowedQuestions || !questions || typeof questions !== 'object') continue

    for (const [questionId, value] of Object.entries(questions as Record<string, unknown>)) {
      if (!allowedQuestions.has(questionId)) continue
      if (typeof value !== 'string' || !value.trim()) continue
      clean[sectionId] ??= {}
      clean[sectionId][questionId] = value.trim().slice(0, MAX_VALUE_LENGTH)
    }
  }
  return clean
}

async function notifyAdvisor(payload: Record<string, unknown>): Promise<void> {
  // Awaitujeme — fire-and-forget fetch se v serverless funkci nemusí stihnout
  // odeslat. Selhání nesmí shodit odeslání: data už jsou v databázi.
  try {
    const res = await fetch('https://n8n.jevcakn8n.com/webhook/novy-klient', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, created_at: new Date().toISOString() }),
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) {
      console.error(`[analyza] n8n webhook selhal: HTTP ${res.status} — odeslání je uložené, jen o něm nepřišla notifikace`)
    }
  } catch (err) {
    console.error('[analyza] n8n webhook nedostupný:', err instanceof Error ? err.message : err)
  }
}

export async function POST(request: Request) {
  try {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      'unknown'

    if (rateLimited(ip)) {
      return NextResponse.json(
        { error: 'Příliš mnoho odeslání z jedné adresy. Zkuste to prosím za chvíli.' },
        { status: 429 },
      )
    }

    const form = await request.formData()

    // Honeypot — pole je v DOM skryté, člověk ho nevyplní, jednoduchý bot ano.
    if (typeof form.get('website') === 'string' && (form.get('website') as string).length > 0) {
      // Tváříme se úspěšně, ať bot nemá zpětnou vazbu k ladění.
      return NextResponse.json({ status: 'created' })
    }

    const responses = sanitizeResponses(JSON.parse((form.get('responses') as string) || '{}'))
    const personal = responses.personal ?? {}

    const email = (personal.email || '').trim().toLowerCase()
    const fullName = (personal.full_name || '').trim()
    const phone = (personal.phone || '').trim()
    const password = typeof form.get('password') === 'string' ? (form.get('password') as string) : ''

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: 'V sekci „Osobní údaje“ vyplňte platný e-mail — bez něj vám nemáme kam poslat návrh.' },
        { status: 400 },
      )
    }
    if (fullName.length < 2) {
      return NextResponse.json(
        { error: 'V sekci „Osobní údaje“ vyplňte jméno a příjmení.' },
        { status: 400 },
      )
    }
    if (password && (password.length < 8 || password.length > 72)) {
      return NextResponse.json({ error: 'Heslo musí mít 8 až 72 znaků.' }, { status: 400 })
    }

    const uploads = form.getAll('files').filter((f): f is File => f instanceof File)
    if (uploads.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Najednou lze nahrát nejvýš ${MAX_FILES} příloh.` },
        { status: 400 },
      )
    }
    for (const file of uploads) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `${file.name}: soubor je větší než 10 MB.` },
          { status: 400 },
        )
      }
    }
    // Ke každé příloze patří sekce, do které ji návštěvník nahrál.
    const fileSections = form.getAll('fileSections').map(String)

    const admin = createAdminClient()

    // 1) Odeslání zapíšeme vždy, ať se stane cokoliv dál — auditní stopa.
    const { data: submission, error: submissionError } = await admin
      .from('public_submissions')
      .insert({
        email,
        full_name: fullName || null,
        phone: phone || null,
        responses,
        files: [],
        has_password: Boolean(password),
      })
      .select('id')
      .single()

    if (submissionError || !submission) {
      console.error('[analyza] zápis odeslání selhal:', submissionError?.message)
      return NextResponse.json(
        { error: 'Odeslání se nepodařilo uložit. Zkuste to prosím znovu.' },
        { status: 500 },
      )
    }

    const submissionId = (submission as { id: string }).id

    // 2) Přílohy nahrajeme do parkoviště — klienta ještě nemusíme mít.
    const storedFiles: SubmissionFile[] = []
    for (const [i, file] of uploads.entries()) {
      const section = fileSections[i] || 'personal'
      const path = `${PARKED_PREFIX}/${submissionId}/${section}/${Date.now()}_${sanitizeFileName(file.name)}`
      const { error } = await admin.storage.from(STORAGE_BUCKET).upload(path, file)
      if (error) {
        console.error(`[analyza] upload ${file.name} selhal: ${error.message}`)
        continue
      }
      storedFiles.push({
        section,
        file_name: file.name,
        file_url: path,
        file_size: file.size,
      })
    }
    if (storedFiles.length > 0) {
      // `files` je jsonb sloupec; SubmissionFile[] je platný JSON, jen ho
      // typ Json neumí odvodit z interface bez index signatury.
      await admin
        .from('public_submissions')
        .update({ files: storedFiles as unknown as Json })
        .eq('id', submissionId)
    }

    // 3) Existuje už účet s tímhle e-mailem?
    const existing = await findUserByEmail(admin, email)

    if (existing) {
      // Nepřepisujeme. Formulář s cizím e-mailem odešle kdokoliv a v analýze
      // jsou zdravotní údaje — o překlopení rozhodne poradce v detailu klienta.
      await admin
        .from('public_submissions')
        .update({ matched_client_id: existing.id })
        .eq('id', submissionId)

      await notifyAdvisor({
        typ: 'analyza_stavajici_klient',
        full_name: fullName,
        email,
        phone,
        submission_id: submissionId,
        client_id: existing.id,
      })

      return NextResponse.json({ status: 'existing' })
    }

    // 4) Nový člověk → založíme účet. Bez hesla se přihlásit nedá; přístup
    //    pošle poradce z detailu klienta, až bude finanční plán hotový.
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      ...(password ? { password } : {}),
      email_confirm: true,
      user_metadata: { full_name: fullName, phone, role: 'client' },
    })

    if (createError || !created.user) {
      console.error('[analyza] založení klienta selhalo:', createError?.message)
      // Odpovědi jsou uložené v public_submissions, takže se nic neztratilo —
      // poradce je uvidí mezi čekajícími odesláními.
      return NextResponse.json({ status: 'existing' })
    }

    const clientId = created.user.id

    await applyResponses(admin, clientId, responses)
    await syncProfileFromResponses(admin, clientId, responses)

    const failedFiles = await attachFilesToClient(admin, clientId, storedFiles)
    if (failedFiles.length > 0) {
      console.error(
        `[analyza] ${failedFiles.length} příloh se nepodařilo připojit ke klientovi ${clientId} — zůstávají v ${PARKED_PREFIX}/${submissionId}`,
      )
    }

    await admin
      .from('public_submissions')
      .update({
        matched_client_id: clientId,
        status: 'applied',
        applied_at: new Date().toISOString(),
      })
      .eq('id', submissionId)

    await notifyAdvisor({
      typ: 'analyza_novy_klient',
      full_name: fullName,
      email,
      phone,
      submission_id: submissionId,
      client_id: clientId,
      ma_heslo: Boolean(password),
    })

    return NextResponse.json({ status: 'created', hasPassword: Boolean(password) })
  } catch (err) {
    console.error('[analyza] neočekávaná chyba:', err instanceof Error ? err.message : err)
    return NextResponse.json(
      { error: 'Nastala neočekávaná chyba. Zkuste to prosím znovu.' },
      { status: 500 },
    )
  }
}
