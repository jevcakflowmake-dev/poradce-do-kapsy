import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { calcHealthScore, goalLabel, incomeLabel, familyLabel, riskLabel } from '@/lib/utils'
import HealthScore from '@/components/dashboard/HealthScore'
import ProposalList from '@/components/dashboard/ProposalList'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile?.onboarding_completed) redirect('/onboarding')

  const { data: proposals } = await supabase
    .from('proposals')
    .select('*')
    .eq('client_id', user.id)
    .order('created_at', { ascending: false })

  const { count: unreadMessages } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', user.id)
    .eq('sender_role', 'advisor')
    .eq('is_read', false)

  const score = calcHealthScore(profile)
  const goals = profile.goals ?? []
  const firstName = profile.full_name?.split(' ')[0] ?? 'uživateli'

  const sections = [
    { key: 'insurance', label: 'Pojištění', icon: '🛡️', count: proposals?.filter(p => p.type === 'insurance').length ?? 0 },
    { key: 'pension', label: 'Důchod', icon: '🏖️', count: proposals?.filter(p => p.type === 'pension').length ?? 0 },
    { key: 'invest', label: 'Investice', icon: '📈', count: proposals?.filter(p => p.type === 'invest').length ?? 0 },
  ]

  return (
    <div className="space-y-5">
      {/* Uvítání */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dobrý den, {firstName}</h1>
          <p className="text-slate-500 text-sm mt-0.5">Váš finanční přehled</p>
        </div>
        {(unreadMessages ?? 0) > 0 && (
          <Link href="/dashboard/chat" className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-white animate-pulse" style={{ background: '#0f2d52' }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {unreadMessages} nové zprávy
          </Link>
        )}
      </div>

      {/* Skóre */}
      <HealthScore score={score} />

      {/* Rychlé akce */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/dashboard/produkty" className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-center gap-3 hover:border-blue-200 hover:shadow transition-all group">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0" style={{ background: 'linear-gradient(135deg, #0f2d52, #1a4170)' }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <div className="font-semibold text-slate-900 text-sm">Moje produkty</div>
            <div className="text-xs text-slate-500">{(proposals?.length ?? 0)} návrhů</div>
          </div>
        </Link>
        <Link href="/dashboard/chat" className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-center gap-3 hover:border-blue-200 hover:shadow transition-all group">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0" style={{ background: 'linear-gradient(135deg, #d4a843, #c8963a)' }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div>
            <div className="font-semibold text-slate-900 text-sm">Chat s poradcem</div>
            <div className="text-xs text-slate-500">{(unreadMessages ?? 0) > 0 ? `${unreadMessages} nepřečtených` : 'Napsat zprávu'}</div>
          </div>
        </Link>
      </div>

      {/* Oblasti */}
      <div className="grid grid-cols-3 gap-3">
        {sections.map(s => (
          <div key={s.key} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 text-center">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-xs font-medium text-slate-600">{s.label}</div>
            <div className="mt-2">
              {s.count > 0 ? (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: '#e8f0fe', color: '#1e40af' }}>
                  {s.count} {s.count === 1 ? 'návrh' : 'návrhy'}
                </span>
              ) : goals.includes(s.key) ? (
                <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">Čeká</span>
              ) : (
                <span className="text-xs text-slate-300">—</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Profil shrnutí */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
        <h2 className="font-semibold text-slate-900 mb-4">Váš profil</h2>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <dt className="text-slate-400">Věk</dt>
          <dd className="font-medium text-slate-800">{profile.age ?? '—'} let</dd>
          <dt className="text-slate-400">Příjem</dt>
          <dd className="font-medium text-slate-800">{incomeLabel(profile.income)}</dd>
          <dt className="text-slate-400">Rodinná situace</dt>
          <dd className="font-medium text-slate-800">{familyLabel(profile.family_status)}</dd>
          <dt className="text-slate-400">Rizikový profil</dt>
          <dd className="font-medium text-slate-800">{riskLabel(profile.risk_profile)}</dd>
        </dl>
        {goals.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-50">
            <p className="text-xs text-slate-400 mb-2">Oblasti zájmu</p>
            <div className="flex flex-wrap gap-2">
              {goals.map(g => (
                <span key={g} className="text-xs bg-slate-50 text-slate-600 border border-slate-200 px-2.5 py-1 rounded-full">
                  {goalLabel(g)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Návrhy */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-slate-900">Poslední návrhy</h2>
          {(proposals?.length ?? 0) > 0 && (
            <Link href="/dashboard/produkty" className="text-sm font-medium" style={{ color: '#0f2d52' }}>
              Zobrazit vše →
            </Link>
          )}
        </div>
        <ProposalList proposals={proposals?.slice(0, 3) ?? []} />
      </div>
    </div>
  )
}
