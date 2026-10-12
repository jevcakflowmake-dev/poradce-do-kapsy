import { NextResponse, after } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { upozornitPoradce } from '@/lib/upozorneni'
import { vytvorLimit } from '@/lib/rate-limit'

/**
 * E-mail poradci, že mu klient napsal. Volá ho prohlížeč klienta hned po
 * uložení zprávy (chat, „Potřebuju vyřešit“) a posílá jen její ID.
 *
 * Neposílá se u každé zprávy:
 *  - Chvíli se počká. Když má poradce konverzaci otevřenou, chat mu zprávu
 *    mezitím označí jako přečtenou a e-mail by byl zbytečný.
 *  - Když v konverzaci už čeká starší nepřečtená zpráva z posledních dvou
 *    hodin, poradce o ní e-mail dostal – tři zprávy za sebou jsou jeden e-mail.
 *    Po dvou hodinách bez přečtení další zpráva upozorní znovu.
 *
 * „Starší“, ne „jiná“: dvě zprávy těsně po sobě by se jinak navzájem
 * vyrušily a neodešel by žádný e-mail.
 */
export const maxDuration = 60

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const CEKANI_MS = 20 * 1000
const PRIPOMENUTI_MS = 2 * 60 * 60 * 1000

/** Brzda pro jednoho klienta; víc než tolik zpráv za hodinu běžný chat nemá. */
const prekrocenLimit = vytvorLimit({ oknoMs: 60 * 60 * 1000, max: 40 })

interface Zprava {
  id: string
  client_id: string
  created_at: string
}

/** Vrátí důvod, proč e-mail neposlat, nebo null, když se poslat má. */
async function procNeposlat(zprava: Zprava): Promise<string | null> {
  const admin = createAdminClient()
  const { data: aktualni } = await admin.from('messages').select('is_read').eq('id', zprava.id).maybeSingle()
  if (!aktualni) return 'zpráva už neexistuje'
  if (aktualni.is_read) return 'poradce ji mezitím přečetl'

  const { count, error } = await admin
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('client_id', zprava.client_id)
    .eq('sender_role', 'client')
    .eq('is_read', false)
    .lt('created_at', zprava.created_at)
    .gt('created_at', new Date(Date.now() - PRIPOMENUTI_MS).toISOString())
  // Když se dotaz nepovede, radši e-mail navíc než žádný.
  if (!error && (count ?? 0) > 0) return 'o starší nepřečtené zprávě už ví'
  return null
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nejste přihlášeni.' }, { status: 401 })

    const body = await request.json().catch(() => null)
    const zpravaId = body?.zprava_id
    if (typeof zpravaId !== 'string' || !UUID.test(zpravaId)) {
      return NextResponse.json({ error: 'Neplatný požadavek.' }, { status: 400 })
    }

    // Čteme přístupem klienta, takže RLS pustí jen jeho vlastní konverzaci.
    const { data: zprava } = await supabase
      .from('messages')
      .select('id, client_id, sender_role, created_at')
      .eq('id', zpravaId)
      .maybeSingle()
    if (!zprava || zprava.client_id !== user.id || zprava.sender_role !== 'client') {
      return NextResponse.json({ error: 'Zpráva nenalezena.' }, { status: 404 })
    }

    if (prekrocenLimit(user.id)) return NextResponse.json({ ok: true })

    after(async () => {
      await new Promise((hotovo) => setTimeout(hotovo, CEKANI_MS))
      const duvod = await procNeposlat(zprava)
      if (duvod) {
        console.info(`[upozorneni] zprava_od_klienta: e-mail poradci se neposílá – ${duvod}`)
        return
      }
      await upozornitPoradce(zprava.client_id)
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[upozorneni] chyba:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Nastala neočekávaná chyba.' }, { status: 500 })
  }
}
