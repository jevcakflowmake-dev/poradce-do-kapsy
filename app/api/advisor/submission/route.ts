import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  applyResponses,
  attachFilesToClient,
  syncProfileFromResponses,
  type Responses,
  type SubmissionFile,
} from '@/lib/submissions'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Rozhodnutí poradce o analýze, kterou z veřejného formuláře poslal někdo
 * s e-mailem stávajícího klienta.
 *
 *   apply   – překlopit odpovědi i přílohy ke klientovi (starší hodnoty přepíše)
 *   discard – zahodit; odeslání zůstane v tabulce jako auditní stopa
 *
 * Automaticky se to nedělá schválně: formulář s cizím e-mailem odešle kdokoliv
 * a jsou v něm zdravotní údaje.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.user_metadata?.role !== 'advisor') {
      return NextResponse.json({ error: 'Nemáte oprávnění.' }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    const submissionId = body?.submission_id
    const action = body?.action

    if (typeof submissionId !== 'string' || !UUID_REGEX.test(submissionId)) {
      return NextResponse.json({ error: 'Neplatné submission_id.' }, { status: 400 })
    }
    if (action !== 'apply' && action !== 'discard') {
      return NextResponse.json({ error: 'Neznámá akce.' }, { status: 400 })
    }

    const admin = createAdminClient()

    const { data: submission } = await admin
      .from('public_submissions')
      .select('*')
      .eq('id', submissionId)
      .single()

    if (!submission) {
      return NextResponse.json({ error: 'Odeslání nenalezeno.' }, { status: 404 })
    }
    if (submission.status !== 'pending') {
      return NextResponse.json(
        { error: 'O tomhle odeslání už bylo rozhodnuto.' },
        { status: 409 },
      )
    }

    if (action === 'discard') {
      await admin
        .from('public_submissions')
        .update({ status: 'discarded' })
        .eq('id', submissionId)
      return NextResponse.json({ ok: true, status: 'discarded' })
    }

    const clientId = submission.matched_client_id
    if (!clientId) {
      return NextResponse.json(
        { error: 'Odeslání nemá přiřazeného klienta – překlopit ho nelze.' },
        { status: 400 },
      )
    }

    const responses = (submission.responses ?? {}) as Responses
    const files = (submission.files ?? []) as unknown as SubmissionFile[]

    await applyResponses(admin, clientId, responses)
    await syncProfileFromResponses(admin, clientId, responses, true)

    const failed = await attachFilesToClient(admin, clientId, files)
    if (failed.length > 0) {
      console.error(
        `[submission] ${failed.length} příloh se nepodařilo připojit ke klientovi ${clientId}`,
      )
    }

    await admin
      .from('public_submissions')
      .update({ status: 'applied', applied_at: new Date().toISOString() })
      .eq('id', submissionId)

    return NextResponse.json({
      ok: true,
      status: 'applied',
      failedFiles: failed.length,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Neočekávaná chyba'
    console.error('[submission] chyba:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
