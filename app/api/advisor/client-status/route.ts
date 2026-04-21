import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { isClientStatus } from '@/lib/utils'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.user_metadata?.role !== 'advisor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    const clientId = body?.client_id
    const status = body?.status

    if (typeof clientId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clientId)) {
      return NextResponse.json({ error: 'Neplatné client_id (UUID).' }, { status: 400 })
    }
    if (!isClientStatus(status)) {
      return NextResponse.json({ error: 'Neplatný status.' }, { status: 400 })
    }

    const { error } = await supabase
      .from('profiles')
      .update({ status })
      .eq('id', clientId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, status })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Internal error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
