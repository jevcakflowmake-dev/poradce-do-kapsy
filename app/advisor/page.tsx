import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  MessageCircle, ArrowUpRight, Sparkles, AlertTriangle, Search, FileText, Send, CalendarClock, Inbox, HelpCircle,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  familyLabel,
  riskLabel,
  formatDate,
  plural,
  statusLabel,
  CLIENT_STATUS_VALUES,
  isClientStatus,
} from '@/lib/utils'
import { goalLabel } from '@/lib/analysis-sections'
import { vyhodnotAnalyzu, POTREBNE_OTAZKY, type AnalyzaOdpovedi } from '@/lib/vyhodnoceni-analyzy'
import { ctiSmlouvu, dalsiVyroci } from '@/lib/smlouvy'
import type { Profile } from '@/lib/types/database'
import StatusBadge from '@/components/advisor/StatusBadge'
import StatusFilter from '@/components/advisor/StatusFilter'

type PageProps = {
  searchParams: Promise<{ status?: string; q?: string }>
}

/** Teď v ms – mimo komponentu, React Compiler nechce Date.now() v renderu. */
function ted() {
  return Date.now()
}

const DEN = 24 * 60 * 60 * 1000
/** Jak dlouho zůstává reakce na plán v „K vyřízení“. */
const REAKCE_DNI = 14
/** Za kolik dní dopředu hlídat výročí smluv. */
const VYROCI_DNI = 30

/** „dnes“, „včera“, „před 3 dny“, starší jako datum. */
function kdy(iso: string | null, nyni: number): string {
  if (!iso) return '–'
  const dny = Math.floor((nyni - new Date(iso).getTime()) / DEN)
  if (dny <= 0) return 'dnes'
  if (dny === 1) return 'včera'
  if (dny < 7) return `před ${dny} dny`
  return new Date(iso).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric' })
}

const bezDiakritiky = (t: string) => t.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

interface Ukol {
  klientId: string
  text: string
  odkaz: string
  akce: string
  ikona: typeof Inbox
}

export default async function AdvisorPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.app_metadata?.role !== 'advisor') redirect('/dashboard')

  const sp = await searchParams
  const statusFilter = isClientStatus(sp.status) ? sp.status : null
  const hledat = (sp.q ?? '').trim().slice(0, 80)
  const nyni = ted()

  const [
    { data: clientsData },
    { data: usersData },
    { data: zpravyKlientu },
    { data: planInterests },
    { data: planVariantSel },
    { data: variantyRaw },
    { data: smlouvyRaw },
    { data: podani },
    { data: odpovediRaw },
  ] = await Promise.all([
    supabase.from('profiles').select('*').order('created_at', { ascending: false }),
    createAdminClient().auth.admin.listUsers({ perPage: 1000 }),
    supabase
      .from('messages')
      .select('client_id, is_read, created_at')
      .eq('sender_role', 'client')
      .order('created_at', { ascending: false })
      .limit(3000),
    supabase.from('plan_section_interest').select('client_id, section, status, updated_at').in('status', ['interested', 'question']),
    supabase.from('plan_variant_selection').select('client_id, variant_id, selected_at'),
    supabase.from('plan_variants').select('id, client_id, company'),
    supabase.from('proposals').select('id, client_id, title, content'),
    supabase.from('public_submissions').select('id, matched_client_id, created_at').eq('status', 'pending'),
    // Flagy z analýzy pro celý seznam. Taháme jen otázky, ze kterých výpočet
    // čte – ne celou analýzu všech klientů.
    supabase.from('analysis_responses').select('client_id, section, question_id, value').in('question_id', POTREBNE_OTAZKY),
  ])

  // Profil zakládá trigger pro každý účet, tedy i pro poradce, a role je jen
  // v auth metadatech. Bez tohoto filtru by se poradci vypsali jako klienti.
  const uzivatele = usersData?.users ?? []
  const advisorIds = new Set(uzivatele.filter((u) => u.app_metadata?.role === 'advisor').map((u) => u.id))
  advisorIds.add(user.id)
  const auth = new Map(uzivatele.map((u) => [u.id, u]))

  const clients: Profile[] = ((clientsData as Profile[] | null) ?? []).filter((c) => !advisorIds.has(c.id))
  const jmeno = new Map(clients.map((c) => [c.id, c.full_name || '(bez jména)']))

  // Nepřečtené zprávy a poslední aktivita klienta – z jeho zpráv, reakcí,
  // výběru variant a přihlášení (auth), co je nejnovější.
  const unreadCounts: Record<string, number> = {}
  const aktivita: Record<string, string> = {}
  const posun = (id: string, iso: string | null | undefined) => {
    if (iso && (!aktivita[id] || iso > aktivita[id])) aktivita[id] = iso
  }
  for (const m of zpravyKlientu ?? []) {
    if (!m.is_read) unreadCounts[m.client_id] = (unreadCounts[m.client_id] || 0) + 1
    posun(m.client_id, m.created_at)
  }
  for (const c of clients) posun(c.id, auth.get(c.id)?.last_sign_in_at)

  // Reakce na plán – počet sekcí se zájmem nebo dotazem + vybrané varianty.
  const reactionCounts: Record<string, number> = {}
  for (const r of planInterests ?? []) {
    reactionCounts[r.client_id] = (reactionCounts[r.client_id] || 0) + 1
    posun(r.client_id, r.updated_at)
  }
  for (const v of planVariantSel ?? []) {
    reactionCounts[v.client_id] = (reactionCounts[v.client_id] || 0) + 1
    posun(v.client_id, v.selected_at)
  }

  const odpovediKlientu: Record<string, AnalyzaOdpovedi> = {}
  for (const r of (odpovediRaw ?? []) as Array<{ client_id: string; section: string; question_id: string; value: string }>) {
    const klient = (odpovediKlientu[r.client_id] ??= {})
    ;(klient[r.section] ??= {})[r.question_id] = r.value
  }
  const flagyKlientu: Record<string, string[]> = {}
  for (const [id, odpovedi] of Object.entries(odpovediKlientu)) {
    const vyhodnoceni = vyhodnotAnalyzu(odpovedi)
    if (vyhodnoceni && vyhodnoceni.flags.length > 0) flagyKlientu[id] = vyhodnoceni.flags
  }

  // ── K vyřízení ─────────────────────────────────────────────
  const ukoly: Ukol[] = []
  const jeKlient = (id: string | null | undefined): id is string => Boolean(id && jmeno.has(id))

  for (const [id, pocet] of Object.entries(unreadCounts)) {
    if (!jeKlient(id)) continue
    ukoly.push({
      klientId: id,
      text: `${pocet} ${plural(pocet, 'nepřečtená zpráva', 'nepřečtené zprávy', 'nepřečtených zpráv')}`,
      odkaz: `/advisor/${id}/chat`,
      akce: 'Odpovědět',
      ikona: MessageCircle,
    })
  }

  const cerstve = (iso: string | null) => Boolean(iso) && nyni - new Date(iso as string).getTime() < REAKCE_DNI * DEN
  const dotazy = new Map<string, number>()
  const zajem = new Map<string, number>()
  for (const r of planInterests ?? []) {
    if (!jeKlient(r.client_id) || !cerstve(r.updated_at)) continue
    const mapa = r.status === 'question' ? dotazy : zajem
    mapa.set(r.client_id, (mapa.get(r.client_id) ?? 0) + 1)
  }
  for (const [id, pocet] of dotazy) {
    ukoly.push({
      klientId: id,
      text: `Dotaz k plánu (${pocet} ${plural(pocet, 'oblast', 'oblasti', 'oblastí')})`,
      odkaz: `/advisor/${id}#reakce`,
      akce: 'Podívat se',
      ikona: HelpCircle,
    })
  }
  for (const [id, pocet] of zajem) {
    ukoly.push({
      klientId: id,
      text: `Zájem o plán (${pocet} ${plural(pocet, 'oblast', 'oblasti', 'oblastí')})`,
      odkaz: `/advisor/${id}#reakce`,
      akce: 'Ozvat se',
      ikona: Sparkles,
    })
  }

  const variantyKlienta = new Map<string, number>()
  const firmaVarianty = new Map<string, string>()
  for (const v of variantyRaw ?? []) {
    variantyKlienta.set(v.client_id, (variantyKlienta.get(v.client_id) ?? 0) + 1)
    firmaVarianty.set(v.id, v.company)
  }
  for (const c of clients) {
    const pocet = variantyKlienta.get(c.id) ?? 0
    if (c.onboarding_completed && pocet === 0 && c.status !== 'archiv') {
      ukoly.push({ klientId: c.id, text: 'Vyplnil analýzu, plán zatím nemá', odkaz: `/advisor/${c.id}/plan`, akce: 'Připravit plán', ikona: FileText })
    } else if (pocet > 0 && !c.plan_zverejnen_at && c.status !== 'archiv') {
      ukoly.push({ klientId: c.id, text: 'Plán je rozdělaný, klient ho nevidí', odkaz: `/advisor/${c.id}/plan`, akce: 'Zveřejnit', ikona: Send })
    }
  }

  const prevedene = new Set<string>()
  for (const s of smlouvyRaw ?? []) {
    const z = ctiSmlouvu(s.content)?.zVarianty
    if (z) prevedene.add(z)
  }
  for (const v of planVariantSel ?? []) {
    if (!jeKlient(v.client_id) || prevedene.has(v.variant_id) || !firmaVarianty.has(v.variant_id)) continue
    ukoly.push({
      klientId: v.client_id,
      text: `Vybral variantu ${firmaVarianty.get(v.variant_id)}, smlouva zatím není`,
      odkaz: `/advisor/${v.client_id}/smlouva?varianta=${v.variant_id}`,
      akce: 'Převést na smlouvu',
      ikona: FileText,
    })
  }

  for (const p of podani ?? []) {
    if (!jeKlient(p.matched_client_id)) continue
    ukoly.push({
      klientId: p.matched_client_id,
      text: 'Poslal novou analýzu, čeká na vaše rozhodnutí',
      odkaz: `/advisor/${p.matched_client_id}`,
      akce: 'Rozhodnout',
      ikona: Inbox,
    })
  }

  const dnes = new Date(nyni)
  for (const s of smlouvyRaw ?? []) {
    const obsah = ctiSmlouvu(s.content)
    if (!jeKlient(s.client_id) || !obsah?.pocatek || obsah.ukonceno) continue
    const vyroci = dalsiVyroci(obsah.pocatek, dnes)
    if (!vyroci) continue
    const zaDni = Math.round((vyroci.getTime() - Date.UTC(dnes.getUTCFullYear(), dnes.getUTCMonth(), dnes.getUTCDate())) / DEN)
    if (zaDni > VYROCI_DNI) continue
    ukoly.push({
      klientId: s.client_id,
      text: `Výročí smlouvy ${s.title} ${zaDni === 0 ? 'dnes' : `za ${zaDni} ${plural(zaDni, 'den', 'dny', 'dní')}`} (${vyroci.toLocaleDateString('cs-CZ', { timeZone: 'UTC' })})`,
      odkaz: `/advisor/${s.client_id}/smlouva/${s.id}`,
      akce: 'Otevřít smlouvu',
      ikona: CalendarClock,
    })
  }

  // ── Seznam ─────────────────────────────────────────────────
  const statusCounts: Record<string, number> = Object.fromEntries(CLIENT_STATUS_VALUES.map((s) => [s, 0]))
  for (const c of clients) statusCounts[c.status] = (statusCounts[c.status] || 0) + 1

  const hledane = bezDiakritiky(hledat)
  const filtered = clients
    // Archiv jen na výslovný filtr – v „vše“ by ukončení klienti překáželi.
    .filter((c) => (statusFilter ? c.status === statusFilter : c.status !== 'archiv'))
    .filter((c) => {
      if (!hledane) return true
      const kde = [c.full_name, auth.get(c.id)?.email, c.phone].filter(Boolean).join(' ')
      return bezDiakritiky(kde).includes(hledane) || (c.phone ?? '').replace(/\s/g, '').includes(hledane.replace(/\s/g, ''))
    })
    // Nejdřív ti, kdo byli naposledy aktivní – s nimi je co řešit.
    .sort((a, b) => (aktivita[b.id] ?? b.created_at).localeCompare(aktivita[a.id] ?? a.created_at))

  return (
    <div className="min-h-screen bg-cream">
      {/* Navbar */}
      <nav className="bg-surface border-b border-line px-6 md:px-10 lg:px-16 xl:px-20 py-4 sticky top-0 z-30">
        <div className="max-w-8xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Stejná značka jako v hlavičce webu – mátová dlaždice, navy tečka */}
            <span aria-hidden className="w-9 h-9 rounded-input bg-mint flex items-end justify-end p-2">
              <span className="block w-1.5 h-1.5 rounded-pill bg-navy" />
            </span>
            {/* Na mobilu by se název i štítek zalomily do dvou řádků – stačí logo se štítkem */}
            <span className="hidden sm:inline font-display text-navy text-lg">Poradce do kapsy</span>
            <span className="ml-2 whitespace-nowrap text-base px-3 py-1 rounded-pill bg-mint/12 text-navy border border-mint/30 font-semibold">
              Panel poradce
            </span>
          </div>
          <form action="/api/auth/signout" method="POST">
            <button className="text-base text-slate hover:text-navy font-medium rounded-pill focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40">Odhlásit</button>
          </form>
        </div>
      </nav>

      <div className="max-w-shell mx-auto px-6 md:px-10 lg:px-16 xl:px-20 py-12 md:py-16">
        {/* Header */}
        <div className="advisor-hero mb-10 md:mb-14">
          <p className="text-xs tracking-[0.3em] uppercase text-slate mb-2">Klienti · pipeline</p>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <h1 className="font-display text-navy text-h2">
              {clients.length} {plural(clients.length, 'klient', 'klienti', 'klientů')}
              <span className="text-slate font-normal text-lead"> ve vaší síti</span>
            </h1>
          </div>
        </div>

        {/* K vyřízení */}
        <section aria-labelledby="k-vyrizeni" className="mb-8 rounded-card border border-line bg-surface p-5 md:p-6">
          <h2 id="k-vyrizeni" className="font-display text-navy text-h3 flex items-center gap-2">
            K vyřízení
            {ukoly.length > 0 && (
              <span className="text-base font-sans font-semibold rounded-pill bg-amber/25 px-2.5 py-0.5 tabular-nums">{ukoly.length}</span>
            )}
          </h2>
          {ukoly.length === 0 ? (
            <p className="mt-2 text-base text-slate">Teď nic nečeká. Nové zprávy, reakce na plán i výročí smluv se objeví tady.</p>
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {ukoly.map((u, i) => (
                <li key={`${u.klientId}-${i}`} className="flex items-start gap-3 py-3">
                  <u.ikona className="w-4 h-4 text-slate shrink-0 mt-1" aria-hidden />
                  {/* Na mobilu akce pod textem – vedle by text stlačila do úzkého sloupce. */}
                  <div className="min-w-0 flex-1 sm:flex sm:items-center sm:gap-4">
                    <p className="min-w-0 sm:flex-1">
                      <Link href={`/advisor/${u.klientId}`} className="font-semibold text-navy hover:underline underline-offset-4">
                        {jmeno.get(u.klientId)}
                      </Link>
                      <span className="text-slate"> · {u.text}</span>
                    </p>
                    <Link
                      href={u.odkaz}
                      className="mt-1 sm:mt-0 inline-flex items-center gap-1 text-sm font-semibold text-navy whitespace-nowrap rounded-pill hover:underline underline-offset-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40"
                    >
                      {u.akce} <ArrowUpRight className="w-3.5 h-3.5" aria-hidden />
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Filter bar */}
        <div className="advisor-hero mb-8 p-5 md:p-6 rounded-card bg-surface border border-line shadow-[0_1px_0_rgba(15,42,68,0.03)] space-y-4">
          <form role="search" method="GET" className="flex gap-2">
            {statusFilter && <input type="hidden" name="status" value={statusFilter} />}
            <label htmlFor="hledat-klienta" className="sr-only">Hledat klienta</label>
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
            <button type="submit" className="h-11 px-5 rounded-pill border border-navy/25 text-navy text-base font-medium hover:border-navy hover:bg-navy/5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40">
              Hledat
            </button>
          </form>
          <StatusFilter counts={statusCounts} total={clients.length - (statusCounts.archiv ?? 0)} />
          <p className="text-sm text-slate">
            {hledat ? `Hledáno „${hledat}“` : 'Filtr'}:{' '}
            <span className="text-navy font-medium">
              {statusFilter ? statusLabel(statusFilter).toLowerCase() : 'vše kromě archivu'} · {filtered.length}
            </span>
            {hledat && (
              <>
                {' '}·{' '}
                <Link href={statusFilter ? `/advisor?status=${statusFilter}` : '/advisor'} className="text-navy underline underline-offset-4">
                  zrušit hledání
                </Link>
              </>
            )}
          </p>
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="advisor-hero bg-surface rounded-card border border-line p-12 md:p-16 text-center">
            <p className="font-display text-navy text-xl mb-1" style={{ letterSpacing: '-0.01em' }}>
              {hledat ? 'Nikoho takového jsem nenašel.' : statusFilter ? 'Žádný klient v tomto stavu.' : 'Zatím žádní klienti.'}
            </p>
            <p className="text-slate text-sm">
              {hledat || statusFilter ? 'Zkuste jiné hledání nebo filtr.' : 'Klienti se zobrazí po registraci, nebo je přidejte sami.'}
            </p>
          </div>
        ) : (
          <div className="bg-surface rounded-card border border-line overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-line bg-cream">
                  <th className="text-left text-[11px] font-semibold text-slate tracking-[0.15em] uppercase px-6 py-4">Klient</th>
                  <th className="text-left text-[11px] font-semibold text-slate tracking-[0.15em] uppercase px-4 py-4 hidden md:table-cell">Stav</th>
                  <th className="text-left text-[11px] font-semibold text-slate tracking-[0.15em] uppercase px-4 py-4 hidden sm:table-cell">Situace</th>
                  <th className="text-left text-[11px] font-semibold text-slate tracking-[0.15em] uppercase px-4 py-4 hidden lg:table-cell">Oblasti</th>
                  <th className="text-left text-[11px] font-semibold text-slate tracking-[0.15em] uppercase px-4 py-4">Aktivita</th>
                  <th className="text-left text-[11px] font-semibold text-slate tracking-[0.15em] uppercase px-4 py-4 hidden lg:table-cell">Registrace</th>
                  <th className="px-4 py-4 text-[11px] font-semibold text-slate tracking-[0.15em] uppercase text-center">Chat</th>
                  <th className="px-6 py-4">
                    <span className="sr-only">Detail</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((client) => (
                  <tr key={client.id} className="group hover:bg-cream transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-navy text-sm md:text-[15px]">{client.full_name || '(bez jména)'}</span>
                        {unreadCounts[client.id] > 0 && (
                          <span
                            title={`${unreadCounts[client.id]} ${plural(unreadCounts[client.id], 'nepřečtená zpráva', 'nepřečtené zprávy', 'nepřečtených zpráv')}`}
                            className="bg-danger text-white text-[10px] font-bold rounded-full min-w-5 h-5 px-1.5 flex items-center justify-center"
                          >
                            {unreadCounts[client.id]}
                          </span>
                        )}
                        {flagyKlientu[client.id]?.length > 0 && (
                          <span
                            title={flagyKlientu[client.id].join('\n')}
                            className="inline-flex items-center gap-1 bg-amber/25 text-navy text-[10px] font-bold rounded-full border border-amber/50 h-5 px-1.5"
                          >
                            <AlertTriangle className="w-2.5 h-2.5" aria-hidden />
                            {flagyKlientu[client.id].length}
                          </span>
                        )}
                        {reactionCounts[client.id] > 0 && (
                          <span
                            title={`${reactionCounts[client.id]} ${plural(reactionCounts[client.id], 'reakce', 'reakce', 'reakcí')} na plán`}
                            className="inline-flex items-center gap-1 bg-mint/12 text-navy text-[10px] font-bold rounded-full border border-mint/30 h-5 px-1.5"
                          >
                            <Sparkles className="w-2.5 h-2.5" aria-hidden />
                            {reactionCounts[client.id]}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate mt-0.5">{riskLabel(client.risk_profile)}</div>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <StatusBadge value={client.status} />
                    </td>
                    <td className="px-4 py-4 hidden sm:table-cell">
                      <span className="text-sm text-navy/80">{familyLabel(client.family_status)}</span>
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {(client.goals ?? []).slice(0, 3).map((g) => (
                          <span key={g} className="text-xs bg-cream text-navy/70 border border-line px-2 py-0.5 rounded-full">
                            {goalLabel(g)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate whitespace-nowrap">
                      {kdy(aktivita[client.id] ?? null, nyni)}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate hidden lg:table-cell">{formatDate(client.created_at)}</td>
                    <td className="px-4 py-4 text-center">
                      <Link
                        href={`/advisor/${client.id}/chat`}
                        aria-label={`Chat s klientem ${client.full_name || ''}`.trim()}
                        className="inline-flex items-center gap-1.5 text-navy hover:text-navy transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" aria-hidden />
                        {unreadCounts[client.id] > 0 && (
                          <span className="bg-danger text-white text-[10px] font-bold rounded-full min-w-5 h-5 px-1.5 flex items-center justify-center">
                            {unreadCounts[client.id]}
                          </span>
                        )}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/advisor/${client.id}`}
                        className="inline-flex items-center gap-1 text-sm text-navy font-semibold hover:gap-2 transition-all whitespace-nowrap"
                      >
                        Detail <ArrowUpRight className="w-3.5 h-3.5" aria-hidden />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
