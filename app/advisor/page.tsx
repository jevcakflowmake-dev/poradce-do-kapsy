import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { calcHealthScore, familyLabel, riskLabel, goalLabel, formatDate } from '@/lib/utils'

export default async function AdvisorPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'advisor') redirect('/dashboard')

  const { data: clients } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  const clientsWithScore = (clients ?? []).map(c => ({
    ...c,
    score: calcHealthScore(c),
  }))

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-900">Poradce do kapsy</span>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Poradce</span>
          </div>
          <form action="/api/auth/signout" method="POST">
            <button className="text-sm text-slate-500 hover:text-slate-700">Odhlásit</button>
          </form>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Klienti</h1>
            <p className="text-slate-500 text-sm mt-0.5">{clientsWithScore.length} registrovaných klientů</p>
          </div>
        </div>

        {clientsWithScore.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <div className="text-4xl mb-3">👥</div>
            <p className="text-slate-600 font-medium">Zatím žádní klienti</p>
            <p className="text-slate-400 text-sm mt-1">Klienti se zobrazí po registraci</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Klient</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-4 py-3 hidden sm:table-cell">Situace</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-4 py-3 hidden md:table-cell">Oblasti</th>
                  <th className="text-center text-xs font-medium text-slate-500 px-4 py-3">Skóre</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-4 py-3 hidden lg:table-cell">Registrace</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clientsWithScore.map(client => (
                  <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900 text-sm">{client.full_name || '(bez jména)'}</div>
                      <div className="text-xs text-slate-400">{riskLabel(client.risk_profile)}</div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-sm text-slate-600">{familyLabel(client.family_status)}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {(client.goals ?? []).slice(0, 3).map(g => (
                          <span key={g} className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                            {goalLabel(g)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block text-sm font-bold w-8 h-8 rounded-full flex items-center justify-center ${
                        client.score >= 70 ? 'bg-green-100 text-green-700' :
                        client.score >= 40 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-600'
                      }`}>
                        {client.score}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400 hidden lg:table-cell">
                      {formatDate(client.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/advisor/${client.id}`}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap"
                      >
                        Detail →
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
