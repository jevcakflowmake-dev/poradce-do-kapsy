import { redirect } from 'next/navigation'
import Link from 'next/link'
import { MessageCircle, ArrowUpRight, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  calcHealthScore,
  familyLabel,
  riskLabel,
  formatDate,
  plural,
  CLIENT_STATUS_VALUES,
  isClientStatus,
} from '@/lib/utils'
import { goalLabel } from '@/lib/analysis-sections'
import type { Profile } from '@/lib/types/database'
import StatusBadge from '@/components/advisor/StatusBadge'
import StatusFilter from '@/components/advisor/StatusFilter'

type PageProps = {
  searchParams: Promise<{ status?: string; q?: string }>
}

export default async function AdvisorPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.app_metadata?.role !== 'advisor') redirect('/dashboard')

  const sp = await searchParams
  const statusFilter = isClientStatus(sp.status) ? sp.status : null

  const { data: clientsData } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  // Profil zakládá trigger pro každý účet, tedy i pro poradce, a role je jen
  // v auth metadatech. Bez tohoto filtru by se poradci vypsali jako klienti.
  const { data: usersData } = await createAdminClient().auth.admin.listUsers({ perPage: 1000 })
  const advisorIds = new Set(
    usersData.users.filter((u) => u.app_metadata?.role === 'advisor').map((u) => u.id),
  )
  advisorIds.add(user.id)

  const clients: Profile[] = ((clientsData as Profile[] | null) ?? []).filter((c) => !advisorIds.has(c.id))

  const { data: unreadMessages } = await supabase
    .from('messages')
    .select('client_id')
    .eq('sender_role', 'client')
    .eq('is_read', false)

  const unreadCounts: Record<string, number> = {}
  for (const m of (unreadMessages as Array<{ client_id: string }> | null) ?? []) {
    unreadCounts[m.client_id] = (unreadCounts[m.client_id] || 0) + 1
  }

  // Plan reactions – počet sekcí se statusem 'interested' nebo 'question' + vybrané varianty.
  // Zobrazeno jako cyan badge; advisor se rozhodne jak zareagovat.
  const { data: planInterests } = await supabase.from('plan_section_interest')
    .select('client_id, status')
    .in('status', ['interested', 'question'])

  const { data: planVariantSel } = await supabase.from('plan_variant_selection')
    .select('client_id')

  const reactionCounts: Record<string, number> = {}
  for (const r of (planInterests as Array<{ client_id: string }> | null) ?? []) {
    reactionCounts[r.client_id] = (reactionCounts[r.client_id] || 0) + 1
  }
  for (const v of (planVariantSel as Array<{ client_id: string }> | null) ?? []) {
    reactionCounts[v.client_id] = (reactionCounts[v.client_id] || 0) + 1
  }

  const statusCounts: Record<string, number> = Object.fromEntries(
    CLIENT_STATUS_VALUES.map((s) => [s, 0]),
  )
  for (const c of clients) statusCounts[c.status] = (statusCounts[c.status] || 0) + 1

  const filtered = statusFilter ? clients.filter((c) => c.status === statusFilter) : clients

  const clientsWithScore = filtered.map((c) => ({
    ...c,
    score: calcHealthScore(c),
  }))

  return (
    <div className="min-h-screen bg-cream">
      {/* Navbar */}
      <nav className="bg-surface border-b border-line px-6 md:px-10 lg:px-16 xl:px-20 py-4 sticky top-0 z-30">
        <div className="max-w-8xl mx-auto flex items-center justify-between">
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
              <h1
                className="font-display text-navy text-h2"
              >
                {clients.length}{' '}
                {plural(clients.length, 'klient', 'klienti', 'klientů')}
                <span className="text-slate font-normal text-lead">
                  {' '}ve vaší síti
                </span>
              </h1>
              <div className="text-sm text-slate">
                Filtr:{' '}
                <span className="text-navy font-medium">
                  {statusFilter ? `${statusFilter.replace('_', ' ')} · ${filtered.length}` : `vše · ${filtered.length}`}
                </span>
              </div>
            </div>
          </div>

          {/* Filter bar */}
          <div className="advisor-hero mb-8 p-5 md:p-6 rounded-card bg-surface border border-line shadow-[0_1px_0_rgba(15,42,68,0.03)]">
            <StatusFilter counts={statusCounts} total={clients.length} />
          </div>

          {/* List */}
          {clientsWithScore.length === 0 ? (
            <div className="advisor-hero bg-surface rounded-card border border-line p-12 md:p-16 text-center">
              <p className="font-display text-navy text-xl mb-1" style={{ letterSpacing: '-0.01em' }}>
                {statusFilter ? 'Žádný klient v tomto stavu.' : 'Zatím žádní klienti.'}
              </p>
              <p className="text-slate text-sm">
                {statusFilter ? 'Zkuste jiný filtr.' : 'Klienti se zobrazí po registraci.'}
              </p>
            </div>
          ) : (
            <div className="bg-surface rounded-card border border-line overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-line bg-cream">
                    <th className="text-left text-[11px] font-semibold text-slate tracking-[0.15em] uppercase px-6 py-4">
                      Klient
                    </th>
                    <th className="text-left text-[11px] font-semibold text-slate tracking-[0.15em] uppercase px-4 py-4 hidden md:table-cell">
                      Stav
                    </th>
                    <th className="text-left text-[11px] font-semibold text-slate tracking-[0.15em] uppercase px-4 py-4 hidden sm:table-cell">
                      Situace
                    </th>
                    <th className="text-left text-[11px] font-semibold text-slate tracking-[0.15em] uppercase px-4 py-4 hidden lg:table-cell">
                      Oblasti
                    </th>
                    <th className="text-center text-[11px] font-semibold text-slate tracking-[0.15em] uppercase px-4 py-4">
                      Skóre
                    </th>
                    <th className="text-left text-[11px] font-semibold text-slate tracking-[0.15em] uppercase px-4 py-4 hidden lg:table-cell">
                      Registrace
                    </th>
                    <th className="px-4 py-4 text-[11px] font-semibold text-slate tracking-[0.15em] uppercase text-center">
                      Chat
                    </th>
                    <th className="px-6 py-4" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {clientsWithScore.map((client) => (
                    <tr
                      key={client.id}
                      className="group hover:bg-cream transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-navy text-sm md:text-[15px]">
                            {client.full_name || '(bez jména)'}
                          </span>
                          {unreadCounts[client.id] > 0 && (
                            <span
                              title={`${unreadCounts[client.id]} ${plural(unreadCounts[client.id], 'nepřečtená zpráva', 'nepřečtené zprávy', 'nepřečtených zpráv')}`}
                              className="bg-danger text-white text-[10px] font-bold rounded-full min-w-5 h-5 px-1.5 flex items-center justify-center"
                            >
                              {unreadCounts[client.id]}
                            </span>
                          )}
                          {reactionCounts[client.id] > 0 && (
                            <span
                              title={`${reactionCounts[client.id]} ${plural(reactionCounts[client.id], 'reakce', 'reakce', 'reakcí')} na plán`}
                              className="inline-flex items-center gap-1 bg-mint/12 text-navy text-[10px] font-bold rounded-full border border-mint/30 h-5 px-1.5"
                            >
                              <Sparkles className="w-2.5 h-2.5" />
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
                            <span
                              key={g}
                              className="text-xs bg-cream text-navy/70 border border-line px-2 py-0.5 rounded-full"
                            >
                              {goalLabel(g)}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span
                          className={`inline-flex items-center justify-center text-sm font-bold w-9 h-9 rounded-full ${
                            client.score >= 70
                              ? 'bg-mint/10 text-navy border border-mint/30'
                              : client.score >= 40
                                ? 'bg-amber/12 text-navy border border-amber/35'
                                : 'bg-danger/10 text-danger border border-danger/30'
                          }`}
                        >
                          {client.score}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate hidden lg:table-cell">
                        {formatDate(client.created_at)}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <Link
                          href={`/advisor/${client.id}/chat`}
                          className="inline-flex items-center gap-1.5 text-navy hover:text-navy transition-colors"
                        >
                          <MessageCircle className="w-4 h-4" />
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
                          Detail <ArrowUpRight className="w-3.5 h-3.5" />
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
