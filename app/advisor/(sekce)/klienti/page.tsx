import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Search, UserPlus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { familyLabel, plural, statusLabel, CLIENT_STATUS_VALUES, isClientStatus } from '@/lib/utils'
import { vyhodnotAnalyzu, POTREBNE_OTAZKY, type AnalyzaOdpovedi } from '@/lib/vyhodnoceni-analyzy'
import { kdy, nactiKlienty } from '@/lib/panel-poradce'
import SeznamKlientu from '@/components/advisor/SeznamKlientu'
import StatusFilter from '@/components/advisor/StatusFilter'

type PageProps = {
  searchParams: Promise<{ status?: string; q?: string }>
}

/** Teď v ms – mimo komponentu, React Compiler nechce Date.now() v renderu. */
function ted() {
  return Date.now()
}

const bezDiakritiky = (t: string) => t.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

/**
 * Seznam klientů. Jen to, podle čeho poradce vybírá, koho otevřít: jméno
 * s upozorněními, stav, situace a poslední aktivita. Zbytek je v detailu,
 * kam vede celý řádek. Dřív tu byly i oblasti zájmu (u všech stejné),
 * datum registrace, ikona chatu a tlačítko Detail.
 */
export default async function KlientiPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.app_metadata?.role !== 'advisor') redirect('/dashboard')

  const sp = await searchParams
  const statusFilter = isClientStatus(sp.status) ? sp.status : null
  const hledat = (sp.q ?? '').trim().slice(0, 80)
  const nyni = ted()

  const [{ klienti, auth }, { data: zpravyKlientu }, { data: zajem }, { data: vybery }, { data: odpovediRaw }] =
    await Promise.all([
      nactiKlienty(supabase, user.id),
      supabase
        .from('messages')
        .select('client_id, is_read, created_at')
        .eq('sender_role', 'client')
        .order('created_at', { ascending: false })
        .limit(3000),
      supabase.from('plan_section_interest').select('client_id, updated_at').in('status', ['interested', 'question']),
      supabase.from('plan_variant_selection').select('client_id, selected_at'),
      // Flagy z analýzy – jen otázky, ze kterých výpočet čte, ne celé analýzy.
      supabase.from('analysis_responses').select('client_id, section, question_id, value').in('question_id', POTREBNE_OTAZKY),
    ])

  // Nepřečtené zprávy a poslední aktivita klienta – z jeho zpráv, reakcí,
  // výběru variant a přihlášení, co je nejnovější.
  const neprectene: Record<string, number> = {}
  const aktivita: Record<string, string> = {}
  const posun = (id: string, iso: string | null | undefined) => {
    if (iso && (!aktivita[id] || iso > aktivita[id])) aktivita[id] = iso
  }
  for (const m of zpravyKlientu ?? []) {
    if (!m.is_read) neprectene[m.client_id] = (neprectene[m.client_id] || 0) + 1
    posun(m.client_id, m.created_at)
  }
  for (const c of klienti) posun(c.id, auth.get(c.id)?.last_sign_in_at)

  const reakce: Record<string, number> = {}
  for (const r of zajem ?? []) {
    reakce[r.client_id] = (reakce[r.client_id] || 0) + 1
    posun(r.client_id, r.updated_at)
  }
  for (const v of vybery ?? []) {
    reakce[v.client_id] = (reakce[v.client_id] || 0) + 1
    posun(v.client_id, v.selected_at)
  }

  const odpovediKlientu: Record<string, AnalyzaOdpovedi> = {}
  for (const r of (odpovediRaw ?? []) as Array<{ client_id: string; section: string; question_id: string; value: string }>) {
    const klient = (odpovediKlientu[r.client_id] ??= {})
    ;(klient[r.section] ??= {})[r.question_id] = r.value
  }
  const flagy: Record<string, string[]> = {}
  for (const [id, odpovedi] of Object.entries(odpovediKlientu)) {
    const vyhodnoceni = vyhodnotAnalyzu(odpovedi)
    if (vyhodnoceni && vyhodnoceni.flags.length > 0) flagy[id] = vyhodnoceni.flags
  }

  const vStavu: Record<string, number> = Object.fromEntries(CLIENT_STATUS_VALUES.map((s) => [s, 0]))
  for (const c of klienti) vStavu[c.status] = (vStavu[c.status] || 0) + 1

  const hledane = bezDiakritiky(hledat)
  const zobrazeni = klienti
    // Archiv jen na výslovný filtr – ve „Vše“ by ukončení klienti překáželi.
    .filter((c) => (statusFilter ? c.status === statusFilter : c.status !== 'archiv'))
    .filter((c) => {
      if (!hledane) return true
      const kde = [c.full_name, auth.get(c.id)?.email, c.phone].filter(Boolean).join(' ')
      return bezDiakritiky(kde).includes(hledane) || (c.phone ?? '').replace(/\s/g, '').includes(hledane.replace(/\s/g, ''))
    })
    // Nejdřív ti, kdo byli naposledy aktivní – s nimi je co řešit.
    .sort((a, b) => (aktivita[b.id] ?? b.created_at).localeCompare(aktivita[a.id] ?? a.created_at))

  const zrusitHledani = statusFilter ? `/advisor/klienti?status=${statusFilter}` : '/advisor/klienti'

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-h2 text-navy">Klienti</h1>
          <p className="mt-1 text-base text-slate">
            {klienti.length} {plural(klienti.length, 'klient', 'klienti', 'klientů')}
            {vStavu.archiv > 0 && `, z toho ${vStavu.archiv} v archivu`}
          </p>
        </div>
        <Link
          href="/advisor/novy"
          className="inline-flex items-center gap-2 h-11 px-5 rounded-pill bg-navy text-cream text-base font-semibold transition-colors hover:bg-navy-deep focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40"
        >
          <UserPlus className="w-4 h-4" aria-hidden /> Přidat klienta
        </Link>
      </div>

      <div className="mt-8 space-y-4">
        <form role="search" method="GET" className="flex gap-2">
          {statusFilter && <input type="hidden" name="status" value={statusFilter} />}
          <label htmlFor="hledat-klienta" className="sr-only">
            Hledat klienta
          </label>
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate" aria-hidden />
            <input
              id="hledat-klienta"
              type="search"
              name="q"
              defaultValue={hledat}
              placeholder="Jméno, e-mail nebo telefon"
              className="w-full h-11 rounded-pill border border-line bg-surface pl-11 pr-4 text-base text-navy placeholder:text-slate focus:outline-none focus:border-mint focus:ring-4 focus:ring-mint/20"
            />
          </div>
          <button
            type="submit"
            className="h-11 px-5 rounded-pill border border-navy/25 bg-surface text-navy text-base font-medium hover:border-navy hover:bg-navy/5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40"
          >
            Hledat
          </button>
        </form>
        <StatusFilter counts={vStavu} total={klienti.length - (vStavu.archiv ?? 0)} />
        {hledat && (
          <p className="text-base text-slate">
            Hledáno „{hledat}“ · {zobrazeni.length} {plural(zobrazeni.length, 'výsledek', 'výsledky', 'výsledků')} ·{' '}
            <Link href={zrusitHledani} className="text-navy underline underline-offset-4">
              zrušit hledání
            </Link>
          </p>
        )}
      </div>

      {zobrazeni.length === 0 ? (
        <div className="mt-6 rounded-card border border-line bg-surface p-10 md:p-14 text-center">
          <p className="font-display text-navy text-xl">
            {hledat ? 'Nikoho takového jsem nenašel.' : statusFilter ? `Ve stavu ${statusLabel(statusFilter).toLowerCase()} nikdo není.` : 'Zatím žádní klienti.'}
          </p>
          <p className="mt-1 text-base text-slate">
            {hledat || statusFilter ? 'Zkuste jiné hledání nebo filtr.' : 'Klienti se zobrazí po registraci, nebo je přidejte sami.'}
          </p>
        </div>
      ) : (
        <SeznamKlientu
          klienti={zobrazeni.map((c) => ({
            id: c.id,
            jmeno: c.full_name || '(bez jména)',
            status: c.status,
            situace: familyLabel(c.family_status),
            aktivita: kdy(aktivita[c.id] ?? null, nyni),
            neprectene: neprectene[c.id] ?? 0,
            flagy: flagy[c.id] ?? [],
            reakce: reakce[c.id] ?? 0,
          }))}
        />
      )}
    </div>
  )
}
