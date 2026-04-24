import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Shield, MessageCircle, ArrowUpRight, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import {
  calcHealthScore,
  familyLabel,
  riskLabel,
  goalLabel,
  formatDate,
  CLIENT_STATUS_VALUES,
  isClientStatus,
} from '@/lib/utils'
import type { Profile } from '@/lib/types/database'
import StatusBadge from '@/components/advisor/StatusBadge'
import StatusFilter from '@/components/advisor/StatusFilter'
import AdvisorListReveal from '@/components/advisor/AdvisorListReveal'

type PageProps = {
  searchParams: Promise<{ status?: string; q?: string }>
}

export default async function AdvisorPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'advisor') redirect('/dashboard')

  const sp = await searchParams
  const statusFilter = isClientStatus(sp.status) ? sp.status : null

  const { data: clientsData } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  const clients: Profile[] = (clientsData as Profile[] | null) ?? []

  const { data: unreadMessages } = await supabase
    .from('messages')
    .select('client_id')
    .eq('sender_role', 'client')
    .eq('is_read', false)

  const unreadCounts: Record<string, number> = {}
  for (const m of (unreadMessages as Array<{ client_id: string }> | null) ?? []) {
    unreadCounts[m.client_id] = (unreadCounts[m.client_id] || 0) + 1
  }

  // Plan reactions — počet sekcí se statusem 'interested' nebo 'question' + vybrané varianty.
  // Zobrazeno jako cyan badge; advisor se rozhodne jak zareagovat.
  const { data: planInterests } = await (supabase.from('plan_section_interest') as any)
    .select('client_id, status')
    .in('status', ['interested', 'question'])

  const { data: planVariantSel } = await (supabase.from('plan_variant_selection') as any)
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
    <div className="min-h-screen bg-[#f8f9fc]">
      {/* Navbar */}
      <nav className="bg-white border-b border-[#E8E9EE] px-6 md:px-10 lg:px-16 xl:px-20 py-4 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#162459] flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" strokeWidth={1.8} />
            </div>
            <span className="font-bold text-[#162459] text-lg tracking-tight">Poradce do kapsy</span>
            <span className="ml-2 text-[11px] tracking-[0.2em] uppercase px-2 py-1 rounded-full bg-[#009EE2]/10 text-[#0088c6] border border-[#009EE2]/30 font-semibold">
              Panel poradce
            </span>
          </div>
          <form action="/api/auth/signout" method="POST">
            <button className="nav-link text-sm text-[#818EAF] hover:text-[#162459] font-medium">Odhlásit</button>
          </form>
        </div>
      </nav>

      <AdvisorListReveal>
        <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16 xl:px-20 py-12 md:py-16">
          {/* Header */}
          <div className="advisor-hero mb-10 md:mb-14">
            <div className="section-numeral text-[3.5rem] md:text-[5rem] mb-2">01</div>
            <p className="text-xs tracking-[0.3em] uppercase text-[#818EAF] mb-2">Klienti · pipeline</p>
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <h1
                className="font-display text-[#162459]"
                style={{
                  fontSize: 'clamp(2rem, 4.5vw, 3.5rem)',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.05,
                }}
              >
                {clients.length} <span style={{ fontStyle: 'italic', color: '#009EE2' }}>klientů</span>
                <span className="text-[#818EAF] font-normal" style={{ fontSize: '0.5em' }}>
                  {' '}ve vaší síti
                </span>
              </h1>
              <div className="text-sm text-[#818EAF]">
                Filtr:{' '}
                <span className="text-[#162459] font-medium">
                  {statusFilter ? `${statusFilter.replace('_', ' ')} · ${filtered.length}` : `vše · ${filtered.length}`}
                </span>
              </div>
            </div>
          </div>

          {/* Filter bar */}
          <div className="advisor-hero mb-8 p-5 md:p-6 rounded-3xl bg-white border border-[#E8E9EE] shadow-[0_1px_0_rgba(22,36,89,0.03)]">
            <StatusFilter counts={statusCounts} total={clients.length} />
          </div>

          {/* List */}
          {clientsWithScore.length === 0 ? (
            <div className="advisor-hero bg-white rounded-3xl border border-[#E8E9EE] p-12 md:p-16 text-center">
              <div className="section-numeral text-[3.5rem] mb-3" style={{ opacity: 0.15 }}>
                00
              </div>
              <p className="font-display text-[#162459] text-xl mb-1" style={{ letterSpacing: '-0.01em' }}>
                {statusFilter ? 'Žádný klient v tomto stavu.' : 'Zatím žádní klienti.'}
              </p>
              <p className="text-[#818EAF] text-sm">
                {statusFilter ? 'Zkuste jiný filtr.' : 'Klienti se zobrazí po registraci.'}
              </p>
            </div>
          ) : (
            <div className="client-table advisor-hero bg-white rounded-3xl border border-[#E8E9EE] overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E8E9EE] bg-[#f8f9fc]">
                    <th className="text-left text-[11px] font-semibold text-[#818EAF] tracking-[0.15em] uppercase px-6 py-4">
                      Klient
                    </th>
                    <th className="text-left text-[11px] font-semibold text-[#818EAF] tracking-[0.15em] uppercase px-4 py-4 hidden md:table-cell">
                      Stav
                    </th>
                    <th className="text-left text-[11px] font-semibold text-[#818EAF] tracking-[0.15em] uppercase px-4 py-4 hidden sm:table-cell">
                      Situace
                    </th>
                    <th className="text-left text-[11px] font-semibold text-[#818EAF] tracking-[0.15em] uppercase px-4 py-4 hidden lg:table-cell">
                      Oblasti
                    </th>
                    <th className="text-center text-[11px] font-semibold text-[#818EAF] tracking-[0.15em] uppercase px-4 py-4">
                      Skóre
                    </th>
                    <th className="text-left text-[11px] font-semibold text-[#818EAF] tracking-[0.15em] uppercase px-4 py-4 hidden lg:table-cell">
                      Registrace
                    </th>
                    <th className="px-4 py-4 text-[11px] font-semibold text-[#818EAF] tracking-[0.15em] uppercase text-center">
                      Chat
                    </th>
                    <th className="px-6 py-4" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E9EE]">
                  {clientsWithScore.map((client) => (
                    <tr
                      key={client.id}
                      className="client-row group hover:bg-[#f8f9fc] transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-[#162459] text-sm md:text-[15px]">
                            {client.full_name || '(bez jména)'}
                          </span>
                          {unreadCounts[client.id] > 0 && (
                            <span
                              title={`${unreadCounts[client.id]} nepřečtených zpráv`}
                              className="bg-[#ea580c] text-white text-[10px] font-bold rounded-full min-w-5 h-5 px-1.5 flex items-center justify-center"
                            >
                              {unreadCounts[client.id]}
                            </span>
                          )}
                          {reactionCounts[client.id] > 0 && (
                            <span
                              title={`${reactionCounts[client.id]} reakcí na plán`}
                              className="inline-flex items-center gap-1 bg-[#009EE2]/12 text-[#0088c6] text-[10px] font-bold rounded-full border border-[#009EE2]/30 h-5 px-1.5"
                            >
                              <Sparkles className="w-2.5 h-2.5" />
                              {reactionCounts[client.id]}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-[#818EAF] mt-0.5">{riskLabel(client.risk_profile)}</div>
                      </td>
                      <td className="px-4 py-4 hidden md:table-cell">
                        <StatusBadge value={client.status} />
                      </td>
                      <td className="px-4 py-4 hidden sm:table-cell">
                        <span className="text-sm text-[#162459]/80">{familyLabel(client.family_status)}</span>
                      </td>
                      <td className="px-4 py-4 hidden lg:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {(client.goals ?? []).slice(0, 3).map((g) => (
                            <span
                              key={g}
                              className="text-xs bg-[#f8f9fc] text-[#162459]/70 border border-[#E8E9EE] px-2 py-0.5 rounded-full"
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
                              ? 'bg-[#16a34a]/10 text-[#15803d] border border-[#16a34a]/30'
                              : client.score >= 40
                                ? 'bg-[#f59e0b]/12 text-[#b45309] border border-[#f59e0b]/35'
                                : 'bg-[#ea580c]/10 text-[#c2410c] border border-[#ea580c]/30'
                          }`}
                        >
                          {client.score}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-[#818EAF] hidden lg:table-cell">
                        {formatDate(client.created_at)}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <Link
                          href={`/advisor/${client.id}/chat`}
                          className="inline-flex items-center gap-1.5 text-[#0088c6] hover:text-[#162459] transition-colors"
                        >
                          <MessageCircle className="w-4 h-4" />
                          {unreadCounts[client.id] > 0 && (
                            <span className="bg-[#ea580c] text-white text-[10px] font-bold rounded-full min-w-5 h-5 px-1.5 flex items-center justify-center">
                              {unreadCounts[client.id]}
                            </span>
                          )}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/advisor/${client.id}`}
                          className="inline-flex items-center gap-1 text-sm text-[#162459] font-semibold hover:gap-2 transition-all whitespace-nowrap"
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
      </AdvisorListReveal>
    </div>
  )
}
