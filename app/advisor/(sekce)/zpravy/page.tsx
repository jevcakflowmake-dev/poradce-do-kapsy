import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { sestavKonverzace } from '@/lib/konverzace'
import { nactiKlienty, neprecteneOdKlientu } from '@/lib/panel-poradce'
import ZpravyPoradce from '@/components/advisor/ZpravyPoradce'

type PageProps = {
  searchParams: Promise<{ klient?: string }>
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Teď v ms – mimo komponentu, React Compiler nechce Date.now() v renderu. */
function ted() {
  return Date.now()
}

/**
 * Zprávy: všechny konverzace a chat na celou stránku. ?klient=… rovnou
 * otevře konverzaci – vedou sem odkazy z Přehledu a z K vyřízení.
 */
export default async function ZpravyPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.app_metadata?.role !== 'advisor') redirect('/dashboard')

  const sp = await searchParams
  const [{ jmeno }, { data: zpravy }] = await Promise.all([
    nactiKlienty(supabase, user.id),
    supabase
      .from('messages')
      .select('client_id, sender_role, content, is_read, created_at')
      .order('created_at', { ascending: false })
      .limit(3000),
  ])

  const konverzace = sestavKonverzace(zpravy ?? [], neprecteneOdKlientu(zpravy ?? []), jmeno, ted())
  const vybrany = sp.klient && UUID.test(sp.klient) && jmeno.has(sp.klient) ? sp.klient : null
  const klienti = [...jmeno]
    .map(([id, j]) => ({ id, jmeno: j }))
    .sort((a, b) => a.jmeno.localeCompare(b.jmeno, 'cs'))

  return (
    <div>
      <h1 className="font-display text-h2 text-navy">Zprávy</h1>
      <div className="mt-6">
        <ZpravyPoradce konverzace={konverzace} klienti={klienti} vybrany={vybrany} />
      </div>
    </div>
  )
}
