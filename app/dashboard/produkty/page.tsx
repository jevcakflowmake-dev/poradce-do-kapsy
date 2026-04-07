import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Proposal } from '@/lib/types/database'
import { proposalTypeLabel, formatDate } from '@/lib/utils'
import ProposalCard from '@/components/dashboard/ProposalCard'
import ProposalList from '@/components/dashboard/ProposalList'

const TYPE_META: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  insurance: { label: 'Pojištění', icon: '🛡️', color: '#1e40af', bg: '#eff6ff' },
  pension: { label: 'Důchod', icon: '🏖️', color: '#6d28d9', bg: '#f5f3ff' },
  invest: { label: 'Investice', icon: '📈', color: '#065f46', bg: '#ecfdf5' },
}

export default async function ProduktyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: proposals } = await supabase
    .from('proposals')
    .select('*')
    .eq('client_id', user.id)
    .order('created_at', { ascending: false })

  const grouped = {
    insurance: (proposals ?? []).filter(p => p.type === 'insurance'),
    pension: (proposals ?? []).filter(p => p.type === 'pension'),
    invest: (proposals ?? []).filter(p => p.type === 'invest'),
  } as Record<string, Proposal[]>

  const hasAny = (proposals?.length ?? 0) > 0

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Moje produkty</h1>
        <p className="text-slate-500 text-sm mt-0.5">Přehled všech návrhů od vašeho poradce</p>
      </div>

      {!hasAny ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
          <div className="text-5xl mb-4">📭</div>
          <h2 className="font-semibold text-slate-900 text-lg mb-2">Zatím žádné návrhy</h2>
          <p className="text-slate-400 text-sm">Poradce vám připraví návrhy do 48 hodin od registrace</p>
        </div>
      ) : (
        <div className="space-y-6">
          {(Object.entries(grouped) as [string, Proposal[]][]).map(([type, list]) => {
            const meta = TYPE_META[type]
            return (
              <div key={type} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {/* Hlavička sekce */}
                <div className="px-5 py-4 flex items-center gap-3 border-b border-slate-50" style={{ background: meta.bg }}>
                  <span className="text-2xl">{meta.icon}</span>
                  <div>
                    <h2 className="font-semibold" style={{ color: meta.color }}>{meta.label}</h2>
                    <p className="text-xs mt-0.5" style={{ color: meta.color, opacity: 0.7 }}>
                      {list.length === 0 ? 'Žádné návrhy' : `${list.length} ${list.length === 1 ? 'návrh' : list.length < 5 ? 'návrhy' : 'návrhů'}`}
                    </p>
                  </div>
                </div>

                {list.length === 0 ? (
                  <div className="px-5 py-6 text-sm text-slate-400">
                    Poradce zatím neposlal žádný návrh v této oblasti.
                  </div>
                ) : (
                  <div className="p-4 space-y-2">
                    {list.map(proposal => (
                      <ProposalCard key={proposal.id} proposal={proposal} />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
