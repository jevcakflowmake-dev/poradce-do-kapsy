// Jen pro serverové routy – v prohlížeči slouží lib/supabase/client.ts.
import 'server-only'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'

/**
 * Klient s veřejným klíčem a bez session. Přes něj serverové routy nechávají
 * Supabase Auth poslat e-mail (potvrzení registrace, nastavení hesla) –
 * admin API účet založí, ale e-mail samo neodešle.
 *
 * Implicitní flow schválně: s PKCE by se klíč k odkazu uložil tady na
 * serveru a odkaz ze staré šablony by v prohlížeči klienta nešel ověřit.
 * Nové šablony vedou přes token_hash na /auth/potvrzeni, tam na flow nezáleží.
 */
export function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('Missing Supabase public credentials')

  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, flowType: 'implicit' },
  })
}
