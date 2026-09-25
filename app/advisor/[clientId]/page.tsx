import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, FileText, MessageCircle, Shield, CheckCircle2, HelpCircle, Clock, Heart, Sparkles, ArrowRight, AlertTriangle, Plus, Pencil } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { calcHealthScore, incomeLabel, familyLabel, riskLabel, proposalTypeLabel, formatDate, plural } from '@/lib/utils'
import { goalLabel, SECTIONS, popisOdpovedi } from '@/lib/analysis-sections'
import { vyhodnotAnalyzu, rozsahVyhodnoceni } from '@/lib/vyhodnoceni-analyzy'
import type { Profile, Proposal } from '@/lib/types/database'
import StatusControl from '@/components/advisor/StatusControl'
import PendingSubmission from '@/components/advisor/PendingSubmission'
import AccessLinkButton from '@/components/advisor/AccessLinkButton'
import ZverejneniPlanu from '@/components/advisor/ZverejneniPlanu'
import StoredFileLink from '@/components/files/StoredFileLink'
import { BARVY } from '@/lib/barvy'
import { ctiSmlouvu, TYP_SMLOUVY_PODLE_SEKCE } from '@/lib/smlouvy'

export default async function ClientDetailPage({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.app_metadata?.role !== 'advisor') return redirect('/dashboard')

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
  // Varianty, ze kterých už poradce smlouvu převedl – u nich místo tlačítka štítek.
  const prevedeneVarianty = new Set(
    (proposals ?? []).map((p) => ctiSmlouvu(p.content)?.zVarianty).filter((id): id is string => Boolean(id)),
  )

  // Load analysis responses
  const { data: analysisRaw } = await supabase.from('analysis_responses')
    .select('*')
    .eq('client_id', clientId)

  const analysisResponses: Record<string, Record<string, string>> = {}
  for (const r of (analysisRaw || []) as Array<{ section: string; question_id: string; value: string }>) {
    if (!analysisResponses[r.section]) analysisResponses[r.section] = {}
    analysisResponses[r.section][r.question_id] = r.value
  }

  const hasAnalysis = Object.keys(analysisResponses).length > 0

  // Vyhodnocení se počítá při každém načtení – je to čistá funkce nad
  // odpověďmi, takže nemůže zastarat. Bez čistého příjmu vrací null.
  const vyhodnoceni = hasAnalysis ? vyhodnotAnalyzu(analysisResponses) : null
  // U „jen úraz“ jen úrazové položky – invalidita a závažná onemocnění z nemoci
  // by v kartě jen mátly, klient je řešit nechtěl.
  const rozsah = rozsahVyhodnoceni(analysisResponses)

  // Dokumenty nahrané klientem v analýze (smlouvy, pojistky)
  const { data: analysisFilesRaw } = await supabase.from('analysis_files')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
  const analysisFiles = (analysisFilesRaw || []) as Array<{
    id: string; section: string; file_name: string; file_url: string; file_size: number
  }>

  // Analýza z veřejného formuláře, o které poradce ještě nerozhodl.
  // Bereme jen nejnovější – starší čekající odeslání jsou v tabulce dohledatelná.
  const { data: pendingRaw } = await supabase
    .from('public_submissions')
    .select('id, email, responses, files, created_at')
    .eq('matched_client_id', clientId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const pendingSubmission = pendingRaw as {
    id: string
    email: string
    responses: Record<string, Record<string, string>>
    files: unknown[]
    created_at: string
  } | null

  // Přišel klient přes veřejnou analýzu a zvolil si v ní heslo? Dřív se tu
  // braly jen odeslání s heslem, takže klient bez hesla – ten, kdo přístup
  // od poradce potřebuje nejvíc – tlačítko pro poslání přístupu neměl.
  const { data: odeslaniRaw } = await supabase
    .from('public_submissions')
    .select('has_password')
    .eq('matched_client_id', clientId)
  const odeslani = (odeslaniRaw as Array<{ has_password: boolean | null }> | null) ?? []
  const cameFromPublicForm = pendingSubmission !== null || odeslani.length > 0
  const clientHasPassword = odeslani.some((o) => o.has_password)

  // Existuje už nějaký plán pro klienta?
  // S head: true dotaz nevrací řádky – počet je v `count` vedle `data`, ne uvnitř.
  const { count: planVariantsCount } = await supabase.from('plan_variants')
    .select('id', { count: 'exact', head: true })
    .eq('client_id', clientId)
  const hasPlan = (planVariantsCount ?? 0) > 0

  // Reakce klienta na finanční plán
  const [{ data: interestRaw }, { data: selRaw }] = await Promise.all([
    supabase.from('plan_section_interest')
      .select('section, status, note, updated_at')
      .eq('client_id', clientId),
    supabase.from('plan_variant_selection')
      .select('variant_id, selected_at, plan_variants(company, section, monthly_payment)')
      .eq('client_id', clientId),
  ])

  type InterestRow = { section: string; status: 'interested' | 'question' | 'not_now'; note: string; updated_at: string }
  type SelectionRow = {
    variant_id: string
    selected_at: string
    plan_variants: { company: string; section: string; monthly_payment: string } | null
  }

  const interestRows = (interestRaw as InterestRow[] | null) ?? []
  const selectionRows = (selRaw as SelectionRow[] | null) ?? []
  const interestMap = new Map(interestRows.map((r) => [r.section, r]))
  const hasAnyReaction = interestRows.length > 0 || selectionRows.length > 0

  const SECTION_LABELS: Record<string, string> = {
    income: 'Zajištění příjmů',
    housing: 'Bydlení',
    retirement: 'Příprava na důchod',
    children: 'Děti',
    investing: 'Investice',
    property: 'Pojištění majetku',
    personal: 'Osobní údaje',
  }

  // Popisky analýzy se berou z definice sekcí, aby nová otázka nebyla holé id.
  // QUESTION_LABELS níž jsou jen zkrácené verze pro hutnější výpis.
  const popisekSekce = (id: string) =>
    SECTIONS.find((x) => x.id === id)?.title ?? SECTION_LABELS[id] ?? id
  const popisekOtazky = (sectionId: string, qId: string) =>
    QUESTION_LABELS[sectionId]?.[qId]
    ?? SECTIONS.find((x) => x.id === sectionId)?.questions.find((q) => q.id === qId)?.label
    ?? qId

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
      housing_situation: 'Bydlení',
      mortgage_balance: 'Zbývá doplatit',
      mortgage_payment: 'Měsíční splátka',
      mortgage_rate: 'Úroková sazba',
      mortgage_fixation: 'Konec fixace',
      mortgage_bank: 'Banka',
      refinance_interest: 'Zájem o refinancování',
      plan_mortgage: 'Plánuje koupi',
      property_type: 'Co řeší',
      property_price: 'Odhadovaná cena',
      mortgage_timeline: 'Kdy chce hypotéku',
      mortgage_location: 'Lokalita',
      saving_for_mortgage: 'Už spoří',
      own_funds: 'Naspořeno',
      monthly_saving: 'Měsíčně odloží',
    },
    retirement: {
      retirement_age: 'Chce do důchodu v',
      desired_pension: 'Cílová renta',
      retirement_saved: 'Odloženo celkem',
      current_savings: 'Odkládá měsíčně',
      monthly_pension_budget: 'Zvládl by odkládat',
      employer_pension: 'Příspěvek zaměstnavatele',
      retirement_other_income: 'Další příjem v důchodu',
    },
    children: {
      children_list: 'Děti',
      children_notes: 'Poznámky k dětem',
    },
    investing: {
      investment_goal: 'Cíl investice',
      investing_experience: 'Zkušenosti s investováním',
      risk_tolerance: 'Tolerance k riziku',
      investment_horizon: 'Investiční horizont',
      monthly_invest: 'Měsíční investice',
      lump_sum_invest: 'Jednorázová investice',
      current_investments: 'Stávající investice',
      tax_advantaged: 'DIP / penzijní spoření',
    },
    property: {
      has_car: 'Vlastní auto',
      car_insurance: 'Pojištění auta',
      car_recalculate: 'Přepočítat auto',
      has_property: 'Vlastní nemovitost',
      owned_property_type: 'Typ nemovitosti',
      property_rented: 'Pronajímá',
      property_insured: 'Stavba pojištěná',
      property_value: 'Hodnota nemovitosti',
      insurance_age: 'Stáří pojistky',
      household_insured: 'Domácnost pojištěná',
      liability_insured: 'Odpovědnost',
      property_interest: 'Chce řešit',
      property_notes: 'Poznámky k majetku',
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
    <div className="min-h-screen bg-cream">
      {/* Navbar */}
      <nav className="bg-surface border-b border-line px-6 md:px-10 lg:px-16 xl:px-20 py-4 sticky top-0 z-30">
        <div className="max-w-8xl mx-auto flex items-center gap-3">
          <Link
            href="/advisor"
            className="inline-flex items-center gap-2 text-slate hover:text-navy transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Zpět na klienty</span>
          </Link>
          <div className="h-6 w-px bg-line mx-1 hidden sm:block" />
          <div className="w-8 h-8 rounded-card bg-navy flex items-center justify-center hidden sm:flex">
            <Shield className="w-4 h-4 text-white" strokeWidth={1.8} />
          </div>
          <span className="font-semibold text-navy flex-1 truncate">
            {profile.full_name || 'Detail klienta'}
          </span>
          <Link
            href={`/advisor/${clientId}/plan`}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-card text-sm font-semibold text-white transition-shadow hover:shadow-lg hover:shadow-mint/20"
            style={{ background: BARVY.navy }}
          >
            <FileText className="w-4 h-4" />
            <span className="hidden md:inline">Finanční plán</span>
          </Link>
          <Link
            href={`/advisor/${clientId}/chat`}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-card text-sm font-semibold text-white"
            style={{ background: BARVY.navy }}
          >
            <MessageCircle className="w-4 h-4" />
            <span className="hidden md:inline">Chat</span>
          </Link>
        </div>
      </nav>

      <div className="max-w-shell mx-auto px-6 md:px-10 lg:px-16 xl:px-20 py-10 md:py-14 space-y-10">
        {pendingSubmission && (
          <PendingSubmission
            submissionId={pendingSubmission.id}
            createdAt={pendingSubmission.created_at}
            email={pendingSubmission.email}
            responses={pendingSubmission.responses ?? {}}
            fileCount={Array.isArray(pendingSubmission.files) ? pendingSubmission.files.length : 0}
          />
        )}

        {/* Hero header s jménem + status control */}
        <header>
          <p className="text-xs tracking-[0.3em] uppercase text-slate mb-2">Klient · profil a aktivita</p>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <h1
              className="font-display text-navy text-h2"
            >
              {profile.full_name || 'Bez jména'}
            </h1>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate uppercase tracking-[0.2em]">Stav:</span>
              <StatusControl clientId={clientId} initial={profile.status ?? 'novy'} />
            </div>
          </div>
        </header>

        {hasAnalysis && (
          <Link
            href={`/advisor/${clientId}/plan`}
            className="group block rounded-card p-5 md:p-6 text-white transition-all hover:shadow-[0_20px_50px_-15px_rgba(31,181,143,0.45)] hover:-translate-y-0.5"
            style={{ background: BARVY.navy }}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-card bg-white/15 backdrop-blur-sm flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6 md:w-7 md:h-7" strokeWidth={1.8} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs uppercase tracking-[0.18em] opacity-80">
                  {hasPlan ? 'Plán existuje' : 'Klient čeká na váš návrh'}
                </p>
                <h2 className="font-display text-xl md:text-2xl mt-0.5" style={{ letterSpacing: '-0.01em' }}>
                  {hasPlan
                    ? <>Upravit finanční plán</>
                    : <>Vytvořit finanční plán na míru</>}
                </h2>
                <p className="text-xs md:text-sm opacity-90 mt-1.5 max-w-2xl">
                  {hasPlan
                    ? 'Přepište údaje z analýzy, doplňte varianty pojistek, nastavte krytí pro 10 typů rizik.'
                    : 'Klient odpověděl na analýzu. Otevřete editor a postavte mu plán – vstupní data, varianty pojistky a graf života.'}
                </p>
              </div>
              <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-1 shrink-0 hidden sm:block" />
            </div>
          </Link>
        )}

        {hasPlan && (
          <ZverejneniPlanu
            clientId={clientId}
            zverejneno={profile.plan_zverejnen_at ?? null}
            maObsah={hasPlan}
          />
        )}

        <section className="grid md:grid-cols-2 gap-5">
          {/* Profil */}
          <div className="bg-surface rounded-card border border-line p-6 md:p-7">
            <div className="flex items-center justify-between mb-5">
              <h2
                className="font-display text-navy text-h3"
              >
                Profil klienta
              </h2>
              <span
                className={`text-sm font-bold px-3 py-1 rounded-full border ${
                  score >= 70
                    ? 'bg-mint/10 text-navy border-mint/30'
                    : score >= 40
                      ? 'bg-amber/12 text-navy border-amber/35'
                      : 'bg-danger/10 text-danger border-danger/30'
                }`}
              >
                Skóre: {score}
              </span>
            </div>
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate">Věk</dt>
                <dd className="font-medium text-navy">{profile.age != null ? `${profile.age} let` : '–'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate">Příjem</dt>
                <dd className="font-medium text-navy">{incomeLabel(profile.income)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate">Rodinná situace</dt>
                <dd className="font-medium text-navy">{familyLabel(profile.family_status)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate">Rizikový profil</dt>
                <dd className="font-medium text-navy">{riskLabel(profile.risk_profile)}</dd>
              </div>
            </dl>
            {(profile.goals ?? []).length > 0 && (
              <div className="mt-5 pt-5 border-t border-line">
                <p className="text-xs text-slate mb-2 tracking-[0.15em] uppercase">Oblasti zájmu</p>
                <div className="flex flex-wrap gap-1.5">
                  {(profile.goals ?? []).map((g) => (
                    <span
                      key={g}
                      className="text-xs bg-mint/8 text-navy border border-mint/25 px-2.5 py-1 rounded-full"
                    >
                      {goalLabel(g)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {cameFromPublicForm && (
            <AccessLinkButton clientId={clientId} hasPassword={clientHasPassword} />
          )}

          {/* Ruční smlouva má vlastní stránku – formulář s platbou, krytím a kontakty
              by detail klienta natáhl na dvojnásobek. */}
          <div className="rounded-card border border-line bg-surface p-6 md:p-7">
            <p className="text-xs tracking-[0.25em] uppercase text-slate mb-1.5">Smlouvy · ručně</p>
            <h2 className="font-display text-navy text-h3">Přidat smlouvu</h2>
            <p className="mt-2 text-base text-slate text-pretty">
              Smlouva, kterou klient už má odjinud nebo kterou jste sjednali mimo plán. Klient ji uvidí v sekci Moje
              smlouvy s platbou a kontakty.
            </p>
            <Link
              href={`/advisor/${clientId}/smlouva/nova`}
              className="mt-5 inline-flex items-center gap-2 h-12 px-6 rounded-pill bg-navy text-cream text-base font-semibold transition-colors hover:bg-navy-deep focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40"
            >
              <Plus className="w-4 h-4" aria-hidden /> Přidat smlouvu
            </Link>
          </div>
        </section>

        {/* Spočítané doporučení z analýzy */}
        {vyhodnoceni && (
          <section>
            <div className="mb-5">
              <p className="text-xs tracking-[0.3em] uppercase text-slate mb-1">vyhodnocení</p>
              <h2 className="font-display text-navy text-h3">Co z analýzy vychází</h2>
              <p className="text-base text-slate mt-2 max-w-2xl">
                Orientační výpočet z odpovědí klienta. Není to nabídka – čísla i konstanty je
                potřeba doladit podle konkrétní pojišťovny.
                {rozsah.jenUraz && ' Klient chce jen úrazové pojištění, proto jsou tu jen úrazové položky.'}
              </p>
            </div>

            {vyhodnoceni.flags.length > 0 && (
              <ul className="mb-5 space-y-2">
                {vyhodnoceni.flags.map((f: string) => (
                  <li
                    key={f}
                    className="flex gap-3 rounded-card border border-line border-l-4 border-l-amber bg-surface p-4 text-base text-navy"
                  >
                    <AlertTriangle className="w-5 h-5 shrink-0 text-navy mt-0.5" strokeWidth={1.8} aria-hidden />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            )}

            {Object.entries(rozsah).some(([k, v]) => k !== 'jenUraz' && v) ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {rozsah.denniOdskodne && (
                  <Castka
                    popisek={rozsah.jenUraz ? 'Denní odškodné za úraz' : 'Denní odškodné'}
                    hodnota={`${vyhodnoceni.denniOdskodne.castkaDenne.toLocaleString('cs-CZ')} Kč/den`}
                    poznamka={
                      rozsah.jenUraz
                        ? 'podle výpadku příjmu při léčení'
                        : `od ${vyhodnoceni.denniOdskodne.odKarencnihoDne}. dne, nemoc i úraz`
                    }
                  />
                )}
                {rozsah.hospitalizace && (
                  <Castka
                    popisek="Hospitalizace"
                    hodnota={`${vyhodnoceni.hospitalizace.castkaDenne.toLocaleString('cs-CZ')} Kč/den`}
                    poznamka={rozsah.jenUraz ? 'při úrazu' : undefined}
                  />
                )}
                {rozsah.invalidita && (
                  <Castka
                    popisek="Invalidita I. / II. / III."
                    hodnota={[vyhodnoceni.invalidita.id1, vyhodnoceni.invalidita.id2, vyhodnoceni.invalidita.id3]
                      .map((x) => (x / 1_000_000).toLocaleString('cs-CZ'))
                      .join(' / ') + ' mil.'}
                    poznamka={vyhodnoceni.invalidita.typ === 'klesajici' ? 'klesající' : 'konstantní'}
                  />
                )}
                {rozsah.zavaznaOnemocneni && (
                  <Castka
                    popisek="Závažná onemocnění"
                    hodnota={`${vyhodnoceni.zavaznaOnemocneni.castka.toLocaleString('cs-CZ')} Kč`}
                  />
                )}
                {rozsah.smrt && (
                  <Castka
                    popisek={rozsah.jenUraz ? 'Smrt úrazem' : 'Smrt'}
                    hodnota={`${vyhodnoceni.smrt.konstantni.toLocaleString('cs-CZ')} Kč`}
                    poznamka={`klesající ${vyhodnoceni.smrt.klesajici.toLocaleString('cs-CZ')} Kč`}
                  />
                )}
                {rozsah.trvaleNasledky && (
                  <Castka
                    popisek="Trvalé následky"
                    hodnota={`${vyhodnoceni.trvaleNasledky.castka.toLocaleString('cs-CZ')} Kč`}
                    poznamka={`progresivní, od ${vyhodnoceni.trvaleNasledky.odProcent.toLocaleString('cs-CZ')} %`}
                  />
                )}
              </div>
            ) : (
              <p className="text-base text-slate">Klient nechtěl krýt žádnou z úrazových položek.</p>
            )}

            {/* Poznámka se týká invalidity z nemoci i úrazu – u úrazovky nesedí. */}
            {rozsah.invalidita && (
              <p className="mt-4 text-base text-slate">{vyhodnoceni.invalidita.poznamka}</p>
            )}
          </section>
        )}

        {/* Odpovědi z analýzy */}
        <section>
          <div className="flex items-end justify-between mb-5">
            <div>
              <p className="text-xs tracking-[0.3em] uppercase text-slate mb-1">analýza</p>
              <h2
                className="font-display text-navy text-h3"
              >
                Odpovědi z{' '}
                analýzy
              </h2>
            </div>
            {hasAnalysis && (
              <span className="text-sm text-slate">
                {Object.keys(analysisResponses).length}{' '}
                {plural(Object.keys(analysisResponses).length, 'sekce vyplněna', 'sekce vyplněny', 'sekcí vyplněno')}
              </span>
            )}
          </div>

          {!hasAnalysis ? (
            <div className="bg-surface rounded-card border border-line p-10 text-center text-slate text-sm">
              Klient zatím nevyplnil analýzu
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {Object.entries(analysisResponses).map(([sectionId, answers]) => (
                <div
                  key={sectionId}
                  className="bg-surface rounded-card border border-line p-6"
                >
                  <h3
                    className="font-display text-navy mb-4 text-lead"
                  >
                    {popisekSekce(sectionId)}
                  </h3>
                  <dl className="space-y-2.5 text-sm">
                    {Object.entries(answers)
                      // Otázky, které z analýzy zmizely (přejmenování, zrušení),
                      // mají v databázi osiřelé odpovědi. Bez popisku by se
                      // poradci vypsaly jako holé id, tak je přeskakujeme –
                      // v `analysis_responses` zůstávají.
                      .filter(([qId]) =>
                        SECTIONS.find((x) => x.id === sectionId)?.questions.some((q) => q.id === qId),
                      )
                      .map(([qId, value]) => (
                      <div key={qId} className="flex justify-between gap-4">
                        <dt className="text-slate shrink-0">
                          {popisekOtazky(sectionId, qId)}
                        </dt>
                        <dd className="font-medium text-navy text-right">
                          {popisOdpovedi(sectionId, qId, value)}
                        </dd>
                      </div>
                      ))}
                  </dl>
                </div>
              ))}
            </div>
          )}

          {/* Dokumenty od klienta – privátní bucket, odkaz přes signed URL */}
          {analysisFiles.length > 0 && (
            <div className="mt-4 bg-surface rounded-card border border-line p-6">
              <h3
                className="font-display text-navy mb-4 text-lead"
              >
                Dokumenty od klienta
              </h3>
              <ul className="space-y-2">
                {analysisFiles.map(f => (
                  <li key={f.id} className="flex items-center gap-3 text-sm">
                    <FileText className="w-4 h-4 text-slate shrink-0" />
                    <StoredFileLink
                      bucket="analysis"
                      path={f.file_url}
                      className="text-navy hover:text-navy transition-colors font-medium text-left truncate"
                    >
                      {f.file_name}
                    </StoredFileLink>
                    <span className="text-xs text-slate shrink-0">
                      {popisekSekce(f.section)} · {(f.file_size / 1024).toFixed(0)} kB
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* Reakce klienta na finanční plán */}
        <section>
          <div className="flex items-end justify-between mb-5">
            <div>
              <p className="text-xs tracking-[0.3em] uppercase text-slate mb-1">reakce na plán</p>
              <h2
                className="font-display text-navy text-h3"
              >
                Jak klient{' '}
                reagoval
              </h2>
            </div>
            {hasAnyReaction && (
              <Link
                href={`/advisor/${clientId}/plan`}
                className="text-sm text-navy hover:text-navy inline-flex items-center gap-1"
              >
                Upravit plán <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
              </Link>
            )}
          </div>

          {!hasAnyReaction ? (
            <div className="bg-surface rounded-card border border-line p-10 text-center text-slate text-sm">
              Klient zatím na plán nereagoval
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {/* Sekce */}
              <div className="bg-surface rounded-card border border-line p-6 md:p-7">
                <h3
                  className="font-display text-navy mb-5 text-lead"
                >
                  Oblasti
                </h3>
                <ul className="space-y-2.5 text-sm">
                  {Object.entries(SECTION_LABELS)
                    .filter(([id]) => id !== 'personal')
                    .map(([id, label]) => {
                      const row = interestMap.get(id)
                      const cfg = row
                        ? row.status === 'interested'
                          ? { icon: CheckCircle2, color: BARVY.mintDark, bg: 'rgba(31,181,143,0.10)', border: 'rgba(31,181,143,0.30)', label: 'Mám zájem' }
                          : row.status === 'question'
                            ? { icon: HelpCircle, color: BARVY.mintDark, bg: 'rgba(31,181,143,0.10)', border: 'rgba(31,181,143,0.30)', label: 'Otázka' }
                            : { icon: Clock, color: BARVY.slate, bg: 'rgba(100,112,125,0.10)', border: 'rgba(100,112,125,0.25)', label: 'Zatím ne' }
                        : null
                      return (
                        <li
                          key={id}
                          className="flex items-center justify-between gap-3 py-1.5"
                        >
                          <span className="text-navy/85">{label}</span>
                          {cfg ? (
                            <span
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium shrink-0"
                              style={{ background: cfg.bg, borderColor: cfg.border, color: cfg.color }}
                            >
                              <cfg.icon className="w-3 h-3" />
                              {cfg.label}
                            </span>
                          ) : (
                            <span className="text-xs text-slate/70">–</span>
                          )}
                        </li>
                      )
                    })}
                </ul>
                {interestRows.some((r) => r.note) && (
                  <div className="mt-5 pt-5 border-t border-line space-y-2.5">
                    <p className="text-xs uppercase tracking-[0.15em] text-slate">
                      Poznámky k dotazům
                    </p>
                    {interestRows
                      .filter((r) => r.note)
                      .map((r) => (
                        <div
                          key={r.section}
                          className="text-xs text-navy/75 bg-cream rounded-card p-3 border border-line"
                        >
                          <span className="font-semibold text-navy">
                            {SECTION_LABELS[r.section] || r.section}:
                          </span>{' '}
                          {r.note}
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Vybrané varianty */}
              <div className="bg-surface rounded-card border border-line p-6 md:p-7">
                <h3
                  className="font-display text-navy mb-5 flex items-center gap-2 text-lead"
                >
                  <Heart className="w-4 h-4 text-navy" strokeWidth={2} />
                  Preferované varianty
                </h3>
                {selectionRows.length === 0 ? (
                  <p className="text-sm text-slate">
                    Klient zatím nevybral konkrétní variantu. Jakmile tak učiní, uvidíte
                    ji zde i jako prioritní akci.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {selectionRows.map((row) => (
                      <li
                        key={row.variant_id}
                        className="p-3 rounded-card border border-mint/25 bg-mint/5"
                      >
                        <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-semibold text-navy text-sm truncate">
                            {row.plan_variants?.company || 'Varianta'}
                          </div>
                          <div className="text-[11px] text-slate uppercase tracking-[0.15em] mt-0.5">
                            {SECTION_LABELS[row.plan_variants?.section ?? ''] || ''} ·{' '}
                            {formatDate(row.selected_at)}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-display text-navy text-lg">
                            {row.plan_variants?.monthly_payment}
                          </span>
                          <div className="text-[11px] text-slate uppercase tracking-[0.1em]">
                            / měsíc
                          </div>
                        </div>
                        </div>
                        {/* Klient vybral – po podpisu ji poradce převede do Moje smlouvy. */}
                        {prevedeneVarianty.has(row.variant_id) ? (
                          <p className="mt-2.5 pt-2.5 border-t border-mint/20 flex items-center gap-1.5 text-sm text-navy">
                            <CheckCircle2 className="w-4 h-4 text-mint-dark" aria-hidden /> Smlouva založena v sekci Moje smlouvy
                          </p>
                        ) : (
                          TYP_SMLOUVY_PODLE_SEKCE[row.plan_variants?.section ?? ''] && (
                            <Link
                              href={`/advisor/${clientId}/smlouva?varianta=${row.variant_id}`}
                              className="mt-2.5 pt-2.5 border-t border-mint/20 flex items-center gap-1.5 text-sm font-semibold text-navy hover:text-mint-dark transition-colors"
                            >
                              Převést na smlouvu <ArrowRight className="w-3.5 h-3.5" aria-hidden />
                            </Link>
                          )
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Seznam odeslaných návrhů */}
        <section>
          <div className="flex items-end justify-between mb-5">
            <div>
              <p className="text-xs tracking-[0.3em] uppercase text-slate mb-1">Moje smlouvy klienta</p>
              <h2 className="font-display text-navy text-h3">Smlouvy</h2>
            </div>
            {proposals && proposals.length > 0 && (
              <span className="text-sm text-slate">
                {proposals.length} {plural(proposals.length, 'záznam', 'záznamy', 'záznamů')}
              </span>
            )}
          </div>

          {!proposals || proposals.length === 0 ? (
            <div className="bg-surface rounded-card border border-line p-10 text-center text-slate text-sm">
              Zatím žádné smlouvy
            </div>
          ) : (
            <div className="bg-surface rounded-card border border-line overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-line bg-cream">
                    <th className="text-left text-[11px] font-semibold text-slate tracking-[0.15em] uppercase px-5 py-4">
                      Název
                    </th>
                    <th className="text-left text-[11px] font-semibold text-slate tracking-[0.15em] uppercase px-4 py-4">
                      Typ
                    </th>
                    <th className="text-left text-[11px] font-semibold text-slate tracking-[0.15em] uppercase px-4 py-4">
                      Stav
                    </th>
                    <th className="text-left text-[11px] font-semibold text-slate tracking-[0.15em] uppercase px-5 py-4">
                      Datum
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {proposals.map((p) => {
                    const ukonceno = ctiSmlouvu(p.content)?.ukonceno
                    return (
                      <tr key={p.id} className="hover:bg-cream transition-colors">
                        <td className="px-5 py-3.5 text-sm">
                          {/* Celý název je odkaz na úpravu – ukončení i smazání jsou tam. */}
                          <Link
                            href={`/advisor/${clientId}/smlouva/${p.id}`}
                            className="inline-flex items-center gap-2 text-navy font-medium underline-offset-4 hover:underline rounded-pill focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40"
                          >
                            {p.title}
                            <Pencil className="w-3.5 h-3.5 text-slate" aria-hidden />
                          </Link>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-xs bg-cream text-navy/70 border border-line px-2.5 py-1 rounded-full">
                            {proposalTypeLabel(p.type)}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          {ukonceno ? (
                            <span className="text-xs text-slate">Ukončená {formatDate(ukonceno)}</span>
                          ) : p.is_read ? (
                            <span className="text-xs text-navy font-medium">Přečteno</span>
                          ) : (
                            <span className="text-xs text-slate">Nepřečteno</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-sm text-slate">{formatDate(p.created_at)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

/** Jedna spočítaná částka v přehledu vyhodnocení. */
function Castka({
  popisek,
  hodnota,
  poznamka,
}: {
  popisek: string
  hodnota: string
  poznamka?: string
}) {
  return (
    <div className="bg-surface rounded-card border border-line p-5">
      <p className="text-base text-slate">{popisek}</p>
      <p className="font-display text-navy text-lead mt-1 tabular-nums">{hodnota}</p>
      {poznamka && <p className="text-base text-slate mt-1">{poznamka}</p>}
    </div>
  )
}
