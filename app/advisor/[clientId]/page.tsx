import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, FileText, MessageCircle, Shield } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { calcHealthScore, incomeLabel, familyLabel, riskLabel, goalLabel, proposalTypeLabel, formatDate } from '@/lib/utils'
import type { Profile, Proposal } from '@/lib/types/database'
import ProposalForm from '@/components/advisor/ProposalForm'
import StatusControl from '@/components/advisor/StatusControl'

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
    <div className="min-h-screen bg-[#f8f9fc]">
      {/* Navbar */}
      <nav className="bg-white border-b border-[#E8E9EE] px-6 md:px-10 lg:px-16 xl:px-20 py-4 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <Link
            href="/advisor"
            className="inline-flex items-center gap-2 text-[#818EAF] hover:text-[#162459] transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Zpět na klienty</span>
          </Link>
          <div className="h-6 w-px bg-[#E8E9EE] mx-1 hidden sm:block" />
          <div className="w-8 h-8 rounded-lg bg-[#162459] flex items-center justify-center hidden sm:flex">
            <Shield className="w-4 h-4 text-white" strokeWidth={1.8} />
          </div>
          <span className="font-semibold text-[#162459] flex-1 truncate">
            {profile.full_name || 'Detail klienta'}
          </span>
          <Link
            href={`/advisor/${clientId}/plan`}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold text-white transition-shadow hover:shadow-lg hover:shadow-[#009EE2]/20"
            style={{ background: 'linear-gradient(135deg, #009EE2 0%, #0088c6 100%)' }}
          >
            <FileText className="w-4 h-4" />
            <span className="hidden md:inline">Finanční plán</span>
          </Link>
          <Link
            href={`/advisor/${clientId}/chat`}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #162459, #243471)' }}
          >
            <MessageCircle className="w-4 h-4" />
            <span className="hidden md:inline">Chat</span>
          </Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16 xl:px-20 py-10 md:py-14 space-y-10">
        {/* Hero header s jménem + status control */}
        <header>
          <div className="section-numeral text-[3.5rem] md:text-[5rem] mb-2">01</div>
          <p className="text-xs tracking-[0.3em] uppercase text-[#818EAF] mb-2">Klient · profil a aktivita</p>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <h1
              className="font-display text-[#162459]"
              style={{
                fontSize: 'clamp(2rem, 4.5vw, 3.25rem)',
                letterSpacing: '-0.02em',
                lineHeight: 1.05,
              }}
            >
              {profile.full_name || 'Bez jména'}
            </h1>
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#818EAF] uppercase tracking-[0.2em]">Stav:</span>
              <StatusControl clientId={clientId} initial={profile.status ?? 'novy'} />
            </div>
          </div>
        </header>

        <section className="grid md:grid-cols-2 gap-5">
          {/* Profil */}
          <div className="bg-white rounded-3xl border border-[#E8E9EE] p-6 md:p-7">
            <div className="flex items-center justify-between mb-5">
              <h2
                className="font-display text-[#162459]"
                style={{ fontSize: '1.25rem', letterSpacing: '-0.01em' }}
              >
                Profil klienta
              </h2>
              <span
                className={`text-sm font-bold px-3 py-1 rounded-full border ${
                  score >= 70
                    ? 'bg-[#16a34a]/10 text-[#15803d] border-[#16a34a]/30'
                    : score >= 40
                      ? 'bg-[#f59e0b]/12 text-[#b45309] border-[#f59e0b]/35'
                      : 'bg-[#ea580c]/10 text-[#c2410c] border-[#ea580c]/30'
                }`}
              >
                Skóre: {score}
              </span>
            </div>
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-[#818EAF]">Věk</dt>
                <dd className="font-medium text-[#162459]">{profile.age ?? '—'} let</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#818EAF]">Příjem</dt>
                <dd className="font-medium text-[#162459]">{incomeLabel(profile.income)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#818EAF]">Rodinná situace</dt>
                <dd className="font-medium text-[#162459]">{familyLabel(profile.family_status)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#818EAF]">Rizikový profil</dt>
                <dd className="font-medium text-[#162459]">{riskLabel(profile.risk_profile)}</dd>
              </div>
            </dl>
            {(profile.goals ?? []).length > 0 && (
              <div className="mt-5 pt-5 border-t border-[#E8E9EE]">
                <p className="text-xs text-[#818EAF] mb-2 tracking-[0.15em] uppercase">Oblasti zájmu</p>
                <div className="flex flex-wrap gap-1.5">
                  {(profile.goals ?? []).map((g) => (
                    <span
                      key={g}
                      className="text-xs bg-[#009EE2]/8 text-[#0088c6] border border-[#009EE2]/25 px-2.5 py-1 rounded-full"
                    >
                      {goalLabel(g)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Formulář pro nový návrh */}
          <ProposalForm clientId={clientId} />
        </section>

        {/* Odpovědi z analýzy */}
        <section>
          <div className="flex items-end justify-between mb-5">
            <div>
              <p className="text-xs tracking-[0.3em] uppercase text-[#818EAF] mb-1">02 · analýza</p>
              <h2
                className="font-display text-[#162459]"
                style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2rem)', letterSpacing: '-0.01em' }}
              >
                Odpovědi z{' '}
                <span style={{ fontStyle: 'italic', color: '#009EE2' }}>dotazníku</span>
              </h2>
            </div>
            {hasAnalysis && (
              <span className="text-sm text-[#818EAF]">
                {Object.keys(analysisResponses).length} sekcí vyplněno
              </span>
            )}
          </div>

          {!hasAnalysis ? (
            <div className="bg-white rounded-3xl border border-[#E8E9EE] p-10 text-center text-[#818EAF] text-sm">
              Klient zatím nevyplnil analýzu
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {Object.entries(analysisResponses).map(([sectionId, answers]) => (
                <div
                  key={sectionId}
                  className="bg-white rounded-3xl border border-[#E8E9EE] p-6"
                >
                  <h3
                    className="font-display text-[#162459] mb-4"
                    style={{ fontSize: '1.05rem', letterSpacing: '-0.01em' }}
                  >
                    {SECTION_LABELS[sectionId] || sectionId}
                  </h3>
                  <dl className="space-y-2.5 text-sm">
                    {Object.entries(answers).map(([qId, value]) => (
                      <div key={qId} className="flex justify-between gap-4">
                        <dt className="text-[#818EAF] shrink-0">
                          {QUESTION_LABELS[sectionId]?.[qId] || qId}
                        </dt>
                        <dd className="font-medium text-[#162459] text-right">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Seznam odeslaných návrhů */}
        <section>
          <div className="flex items-end justify-between mb-5">
            <div>
              <p className="text-xs tracking-[0.3em] uppercase text-[#818EAF] mb-1">03 · aktivita</p>
              <h2
                className="font-display text-[#162459]"
                style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2rem)', letterSpacing: '-0.01em' }}
              >
                Odeslané{' '}
                <span style={{ fontStyle: 'italic', color: '#009EE2' }}>návrhy</span>
              </h2>
            </div>
            {proposals && proposals.length > 0 && (
              <span className="text-sm text-[#818EAF]">{proposals.length} záznamů</span>
            )}
          </div>

          {!proposals || proposals.length === 0 ? (
            <div className="bg-white rounded-3xl border border-[#E8E9EE] p-10 text-center text-[#818EAF] text-sm">
              Zatím žádné návrhy
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-[#E8E9EE] overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E8E9EE] bg-[#f8f9fc]">
                    <th className="text-left text-[11px] font-semibold text-[#818EAF] tracking-[0.15em] uppercase px-5 py-4">
                      Název
                    </th>
                    <th className="text-left text-[11px] font-semibold text-[#818EAF] tracking-[0.15em] uppercase px-4 py-4">
                      Typ
                    </th>
                    <th className="text-left text-[11px] font-semibold text-[#818EAF] tracking-[0.15em] uppercase px-4 py-4">
                      Stav
                    </th>
                    <th className="text-left text-[11px] font-semibold text-[#818EAF] tracking-[0.15em] uppercase px-5 py-4">
                      Datum
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E9EE]">
                  {proposals.map((p) => (
                    <tr key={p.id} className="hover:bg-[#f8f9fc] transition-colors">
                      <td className="px-5 py-3.5 text-sm text-[#162459]">{p.title}</td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs bg-[#f8f9fc] text-[#162459]/70 border border-[#E8E9EE] px-2.5 py-1 rounded-full">
                          {proposalTypeLabel(p.type)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        {p.is_read ? (
                          <span className="text-xs text-[#15803d] font-medium">Přečteno</span>
                        ) : (
                          <span className="text-xs text-[#818EAF]">Nepřečteno</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-[#818EAF]">{formatDate(p.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
