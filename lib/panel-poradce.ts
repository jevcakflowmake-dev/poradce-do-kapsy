import 'server-only'
import type { User } from '@supabase/supabase-js'
import type { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Profile } from '@/lib/types/database'

/**
 * Společné načítání pro sekce panelu poradce (Přehled, Klienti, Zprávy).
 * Každá stránka si dál bere jen to, co ukazuje – tady je jen to, co by se
 * jinak opisovalo třikrát.
 */

type Supabase = Awaited<ReturnType<typeof createClient>>

const DEN = 24 * 60 * 60 * 1000

/**
 * Klienti bez poradců. Profil zakládá trigger pro každý účet, tedy i pro
 * poradce, a role je jen v auth metadatech – bez tohoto filtru by se
 * poradci vypsali jako klienti.
 */
export async function nactiKlienty(supabase: Supabase, poradceId: string) {
  const [{ data: profily }, { data: ucty }] = await Promise.all([
    supabase.from('profiles').select('*').order('created_at', { ascending: false }),
    createAdminClient().auth.admin.listUsers({ perPage: 1000 }),
  ])
  const uzivatele = ucty?.users ?? []
  const poradci = new Set(uzivatele.filter((u) => u.app_metadata?.role === 'advisor').map((u) => u.id))
  poradci.add(poradceId)

  const klienti = ((profily as Profile[] | null) ?? []).filter((c) => !poradci.has(c.id))
  return {
    klienti,
    /** E-mail a poslední přihlášení – jsou jen v auth, profil je nemá. */
    auth: new Map<string, User>(uzivatele.map((u) => [u.id, u])),
    jmeno: new Map(klienti.map((c) => [c.id, c.full_name || '(bez jména)'])),
  }
}

/** Nepřečtené zprávy od klientů podle klienta. */
export function neprecteneOdKlientu(zpravy: ReadonlyArray<{ client_id: string; sender_role: string; is_read: boolean }>) {
  const pocty: Record<string, number> = {}
  for (const m of zpravy) {
    if (m.sender_role === 'client' && !m.is_read) pocty[m.client_id] = (pocty[m.client_id] || 0) + 1
  }
  return pocty
}

/** „dnes“, „včera“, „před 3 dny“, starší jako datum. */
export function kdy(iso: string | null, nyni: number): string {
  if (!iso) return '–'
  const dny = Math.floor((nyni - new Date(iso).getTime()) / DEN)
  if (dny <= 0) return 'dnes'
  if (dny === 1) return 'včera'
  if (dny < 7) return `před ${dny} dny`
  return new Date(iso).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric', timeZone: 'Europe/Prague' })
}
