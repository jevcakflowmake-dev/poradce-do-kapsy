import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { calcHealthScore, incomeLabel, familyLabel, riskLabel, goalLabel, proposalTypeLabel, formatDate } from '@/lib/utils'
import type { Profile, Proposal } from '@/lib/types/database'
import ProposalForm from '@/components/advisor/ProposalForm'

export default async function ClientDetailPage({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'advisor') return redirect('/dashboard')

  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', clientId)
    .single()

  if (!profileData) return notFound()

  const profile = profileData as Profile

  const { data: proposalsData } = await supabase
    .from('proposals')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })

  const proposals = proposalsData as Proposal[] | null

  // Load analysis responses
  const { data: analysisRaw } = await (supabase.from('analysis_responses') as any)
    .select('*')
    .eq('client_id', clientId)

  const analysisResponses: Record<string, Record<string, string>> = {}
  for (const r of (analysisRaw || []) as Array<{ section: string; question_id: string; value: string }>) {
    if (!analysisResponses[r.section]) analysisResponses[r.section] = {}
    analysisResponses[r.section][r.question_id] = r.value
  }

  const hasAnalysis = Object.keys(analysisResponses).length > 0

  const SECTION_LABELS: Record<string, string> = {
    income: 'Zajištění příjmů',
    housing: 'Bydlení',
    retirement: 'Příprava na důchod',
    children: 'Děti',
    investing: 'Investice',
    property: 'Pojištění majetku',
    personal: 'Osobní údaje',
  }

  const QUESTION_LABELS: Record<string, Record<string, string>> = {
    income: {
      employment: 'Pracovní poměr',
      monthly_income: 'Čistý měsíční příjem',
      income_drop: 'Požadované zajištění při poklesu příjmu',
      permanent_consequences: 'Zajištění trvalých následků',
      invalidity: 'Zajištění invalidity',
      serious_illness: 'Zajištění závažné nemoci',
      long_term_care: 'Dlouhodobá péče',
      death_coverage: 'Zajištění při smrti',
      death_coverage_amount: 'Částka na splacení závazků',
      monthly_budget: 'Měsíční rozpočet na pojištění',
      preferred_companies: 'Preferované společnosti',
    },
    housing: {
      has_mortgage: 'Má hypotéku',
      plan_mortgage: 'Plánuje hypotéku',
      mortgage_amount: 'Výše úvěru',
      property_type: 'Typ nemovitosti',
      mortgage_timeline: 'Časový horizont koupě',
      mortgage_location: 'Lokalita',
    },
    retirement: {
      current_savings: 'Aktuální spoření na důchod',
      pension_gap: 'Potřebná částka k důchodu',
      monthly_pension_budget: 'Měsíční odkládání na důchod',
    },
    children: {
      children_count: 'Počet dětí',
      children_ages: 'Věk dětí',
      children_insurance: 'Pojištění dětí',
      children_savings: 'Spoření dětem',
      children_monthly: 'Měsíční spoření',
      children_notes: 'Poznámky',
    },
    investing: {
      investing_experience: 'Zkušenosti s investováním',
      risk_tolerance: 'Tolerance k riziku',
      investment_horizon: 'Investiční horizont',
      monthly_invest: 'Měsíční investice',
      current_investments: 'Stávající investice',
    },
    property: {
      has_car: 'Vlastní auto',
      car_insurance: 'Pojištění auta',
      car_recalculate: 'Přepočítat pojištění',
      has_property: 'Vlastní nemovitost',
      property_type: 'Typ nemovitosti',
      property_insured: 'Pojištěná nemovitost',
      want_property_insurance: 'Chce pojistit',
      property_value: 'Hodnota nemovitosti',
      combined_insurance: 'Kombinované pojištění',
      property_notes: 'Poznámky',
    },
    personal: {
      full_name: 'Jméno',
      email: 'E-mail',
      phone: 'Telefon',
      age: 'Věk',
      height: 'Výška',
      weight: 'Váha',
      serious_illness: 'Vážné nemoci',
      injury: 'Úrazy',
      occupation: 'Zaměstnání',
    },
  }

  const score = calcHealthScore(profile)

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <Link href="/advisor" className="text-slate-400 hover:text-slate-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <span className="font-semibold text-slate-900 flex-1">{profile.full_name || 'Detail klienta'}</span>
          <Link
            href={`/advisor/${clientId}/plan`}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-white"
            style={{ backgroundColor: '#009EE2' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Financni plan
          </Link>
          <Link
            href={`/advisor/${clientId}/chat`}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-white"
            style={{ background: 'linear-gradient(135deg, #162459, #243471)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Chat
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto p-4 space-y-5">
        <div className="grid md:grid-cols-2 gap-5">
          {/* Profil */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-900">Profil klienta</h2>
              <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                score >= 70 ? 'bg-green-100 text-green-700' :
                score >= 40 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-600'
              }`}>
                Skóre: {score}
              </span>
            </div>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Věk</dt>
                <dd className="font-medium text-slate-900">{profile.age ?? '—'} let</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Příjem</dt>
                <dd className="font-medium text-slate-900">{incomeLabel(profile.income)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Rodinná situace</dt>
                <dd className="font-medium text-slate-900">{familyLabel(profile.family_status)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Rizikový profil</dt>
                <dd className="font-medium text-slate-900">{riskLabel(profile.risk_profile)}</dd>
              </div>
            </dl>
            {(profile.goals ?? []).length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-500 mb-2">Oblasti zájmu</p>
                <div className="flex flex-wrap gap-1.5">
                  {(profile.goals ?? []).map(g => (
                    <span key={g} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                      {goalLabel(g)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Formulář pro nový návrh */}
          <ProposalForm clientId={clientId} />
        </div>

        {/* Odpovědi z analýzy */}
        <div>
          <h2 className="font-semibold text-slate-900 mb-3">
            Odpovědi z analýzy
            {hasAnalysis && (
              <span className="ml-2 text-sm font-normal text-slate-500">
                ({Object.keys(analysisResponses).length} sekcí vyplněno)
              </span>
            )}
          </h2>

          {!hasAnalysis ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-sm">
              Klient zatím nevyplnil analýzu
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {Object.entries(analysisResponses).map(([sectionId, answers]) => (
                <div key={sectionId} className="bg-white rounded-xl border border-slate-200 p-5">
                  <h3 className="font-semibold text-sm mb-3" style={{ color: '#162459' }}>
                    {SECTION_LABELS[sectionId] || sectionId}
                  </h3>
                  <dl className="space-y-2 text-sm">
                    {Object.entries(answers).map(([qId, value]) => (
                      <div key={qId} className="flex justify-between gap-4">
                        <dt className="text-slate-500 shrink-0">
                          {QUESTION_LABELS[sectionId]?.[qId] || qId}
                        </dt>
                        <dd className="font-medium text-slate-900 text-right">
                          {value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Seznam odeslaných návrhů */}
        <div>
          <h2 className="font-semibold text-slate-900 mb-3">
            Odeslané návrhy
            {proposals && proposals.length > 0 && (
              <span className="ml-2 text-sm font-normal text-slate-500">({proposals.length})</span>
            )}
          </h2>

          {(!proposals || proposals.length === 0) ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-sm">
              Zatím žádné návrhy
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Název</th>
                    <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Typ</th>
                    <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Přečteno</th>
                    <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Datum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {proposals.map(p => (
                    <tr key={p.id}>
                      <td className="px-4 py-3 text-sm text-slate-900">{p.title}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                          {proposalTypeLabel(p.type)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {p.is_read ? (
                          <span className="text-xs text-green-600">Přečteno</span>
                        ) : (
                          <span className="text-xs text-slate-400">Nepřečteno</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-400">{formatDate(p.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
