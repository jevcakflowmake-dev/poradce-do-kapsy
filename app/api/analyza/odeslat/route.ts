import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  applyResponses,
  attachFilesToClient,
  findUserByEmail,
  ocistiOdpovedi,
  syncProfileFromResponses,
  PARKED_PREFIX,
  SEKCE_ANALYZY,
  STORAGE_BUCKET,
  type SubmissionFile,
} from '@/lib/submissions'
import { MAX_FILE_SIZE, jePovolenaPriloha, sanitizeFileName, sTypem } from '@/lib/storage'
import { ipPozadavku, vytvorLimit } from '@/lib/rate-limit'
import { createPublicClient } from '@/lib/supabase/verejny'
import { absoluteUrl } from '@/lib/site'
import type { Json } from '@/lib/types/database'

/**
 * Příjem veřejné analýzy z /analyza – jediný endpoint aplikace, který smí
 * volat kdokoliv bez přihlášení. Tomu odpovídá i míra nedůvěry ke vstupu:
 * povolujeme jen otázky, které v analýze opravdu existují, omezujeme délku
 * hodnot, počet i velikost příloh a držíme jednoduchý rate limit.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_FILES = 10

/** Pět odeslání za deset minut z jedné adresy – víc člověk nepotřebuje. */
const rateLimited = vytvorLimit({ oknoMs: 10 * 60 * 1000, max: 5 })

async function notifyAdvisor(payload: Record<string, unknown>): Promise<void> {
  // Awaitujeme – fire-and-forget fetch se v serverless funkci nemusí stihnout
  // odeslat. Selhání nesmí shodit odeslání: data už jsou v databázi.
  try {
    const res = await fetch('https://n8n.jevcakn8n.com/webhook/novy-klient', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, created_at: new Date().toISOString() }),
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) {
      console.error(`[analyza] n8n webhook selhal: HTTP ${res.status} – odeslání je uložené, jen o něm nepřišla notifikace`)
    }
  } catch (err) {
    console.error('[analyza] n8n webhook nedostupný:', err instanceof Error ? err.message : err)
  }
}

export async function POST(request: Request) {
  try {
    if (rateLimited(ipPozadavku(request))) {
      return NextResponse.json(
        { error: 'Příliš mnoho odeslání z jedné adresy. Zkuste to prosím za chvíli.' },
        { status: 429 },
      )
    }

    const form = await request.formData()

    // Honeypot – pole je v DOM skryté, člověk ho nevyplní, jednoduchý bot ano.
    if (typeof form.get('website') === 'string' && (form.get('website') as string).length > 0) {
      // Tváříme se úspěšně, ať bot nemá zpětnou vazbu k ladění.
      return NextResponse.json({ status: 'created' })
    }

    const responses = ocistiOdpovedi(JSON.parse((form.get('responses') as string) || '{}'))
    const personal = responses.personal ?? {}

    const email = (personal.email || '').trim().toLowerCase()
    const fullName = (personal.full_name || '').trim()
    const phone = (personal.phone || '').trim()
    const password = typeof form.get('password') === 'string' ? (form.get('password') as string) : ''

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: 'V sekci „Osobní údaje“ vyplňte platný e-mail – bez něj vám nemáme kam poslat návrh.' },
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
      if (!jePovolenaPriloha(file)) {
        return NextResponse.json(
          { error: `${file.name}: nahrát jde jen PDF, JPG nebo PNG.` },
          { status: 400 },
        )
      }
    }
    // Ke každé příloze patří sekce, do které ji návštěvník nahrál.
    const fileSections = form.getAll('fileSections').map(String)

    const admin = createAdminClient()

    // 1) Odeslání zapíšeme vždy, ať se stane cokoliv dál – auditní stopa.
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

    // 2) Přílohy nahrajeme do parkoviště – klienta ještě nemusíme mít.
    const storedFiles: SubmissionFile[] = []
    for (const [i, file] of uploads.entries()) {
      // Sekce jde do cesty ve storage a u klienta i do složky, kam se příloha
      // přesune. Z formuláře přijde cokoliv, třeba „../cizi-id“ – bereme jen známé.
      const section = SEKCE_ANALYZY.has(fileSections[i]) ? fileSections[i] : 'personal'
      const path = `${PARKED_PREFIX}/${submissionId}/${section}/${Date.now()}_${sanitizeFileName(file.name)}`
      const { error } = await admin.storage.from(STORAGE_BUCKET).upload(path, sTypem(file))
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
      // jsou zdravotní údaje – o překlopení rozhodne poradce v detailu klienta.
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
    const zalozUcet = (heslo: string) =>
      admin.auth.admin.createUser({
        email,
        ...(heslo ? { password: heslo } : {}),
        // S heslem nepotvrzený: přihlásit se půjde až po kliknutí na odkaz
        // v e-mailu, jinak by kdokoliv vyplnil analýzu za cizí e-mail se svým
        // heslem a do účtu se přihlásil. Bez hesla se přihlásit nedá tak jako
        // tak – přístup pošle poradce.
        email_confirm: !heslo,
        user_metadata: { full_name: fullName, phone },
        // role patří do app_metadata – do user_metadata si zapíše uživatel sám
        app_metadata: { role: 'client' },
      })

    let { data: created, error: createError } = await zalozUcet(password)
    // Heslo, které Supabase odmítl (uniklé, slabé), analýzu nezahodí: účet
    // vznikne bez hesla a přístup pošle poradce, jako by heslo nevyplnil.
    const slabeHeslo = Boolean(password) && createError?.code === 'weak_password'
    if (slabeHeslo) {
      ;({ data: created, error: createError } = await zalozUcet(''))
      await admin.from('public_submissions').update({ has_password: false }).eq('id', submissionId)
    }
    const maHeslo = Boolean(password) && !slabeHeslo

    if (createError || !created.user) {
      console.error('[analyza] založení klienta selhalo:', createError?.message)
      // Odpovědi jsou uložené v public_submissions, takže se nic neztratilo –
      // poradce je uvidí mezi čekajícími odesláními.
      return NextResponse.json({ status: 'existing' })
    }

    const clientId = created.user.id

    if (maHeslo) {
      // Admin API potvrzovací e-mail samo nepošle, resend ano (šablona Confirm sign up).
      const { error: odeslani } = await createPublicClient().auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: absoluteUrl('/login?potvrzeno=1') },
      })
      if (odeslani) console.error('[analyza] potvrzovací e-mail neodešel:', odeslani.message)
    }

    await applyResponses(admin, clientId, responses)
    await syncProfileFromResponses(admin, clientId, responses, true)

    const failedFiles = await attachFilesToClient(admin, clientId, storedFiles)
    if (failedFiles.length > 0) {
      console.error(
        `[analyza] ${failedFiles.length} příloh se nepodařilo připojit ke klientovi ${clientId} – zůstávají v ${PARKED_PREFIX}/${submissionId}`,
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
      ma_heslo: maHeslo,
    })

    return NextResponse.json({ status: 'created', hasPassword: maHeslo, slabeHeslo })
  } catch (err) {
    console.error('[analyza] neočekávaná chyba:', err instanceof Error ? err.message : err)
    return NextResponse.json(
      { error: 'Nastala neočekávaná chyba. Zkuste to prosím znovu.' },
      { status: 500 },
    )
  }
}
