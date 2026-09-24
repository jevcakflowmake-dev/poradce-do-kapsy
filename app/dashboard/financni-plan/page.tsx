'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  FileText, Download, Clock, Shield, TrendingUp,
  Home as HomeIcon, Baby, Building2, ChevronDown, ChevronUp,
  CheckCircle2, AlertCircle, Target, Sparkles, Loader2, X,
} from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { notifyAdvisor } from '@/lib/notify'
import SectionInterestToolbar, { type InterestStatus } from '@/components/dashboard/SectionInterestToolbar'
import AskModal from '@/components/dashboard/AskModal'
import SelectVariantButton from '@/components/dashboard/SelectVariantButton'
import { Button, buttonVariants } from '@/components/ui/button'
import { formatDate, plural } from '@/lib/utils'
import { PORADCE } from '@/lib/poradce'
import FinancialPlanOverview from '@/components/dashboard/charts/FinancialPlanOverview'
import IncomeLifeChart, { type IncomeVariant } from '@/components/dashboard/charts/IncomeLifeChart'
import SrovnaniNabidek, { type SoucasnaHypoteka } from '@/components/dashboard/charts/SrovnaniNabidek'
import { VyberVarianty } from '@/components/dashboard/charts/SrovnaniVariant'
import DuchodVCislech from '@/components/dashboard/DuchodVCislech'
import { TiskovaTitulka, TiskovyZaver } from '@/components/dashboard/TiskovyRamec'
import { spoctiDuchod, type VysledekDuchod } from '@/lib/duchod'
import { ctiProdukt, odkazNaKontakt, type ProduktVarianty } from '@/lib/produkt-varianty'
import { QRCodeSVG } from 'qrcode.react'
import { BARVY } from '@/lib/barvy'

interface ParamDetail { value: string; note: string }
interface Variant {
  id: string
  company: string
  logo: string
  monthlyPayment: string
  params: Record<string, ParamDetail>
  /** Co to je za produkt a kam volat, když nastane událost. Nepovinné. */
  produkt: ProduktVarianty | null
}
interface PlanSection {
  id: string
  title: string
  icon: typeof Shield
  type: 'variants' | 'simple'
  variants?: Variant[]
  items?: string[]
  status: 'ok' | 'recommendation' | 'action'
}

const sectionConfig: Record<string, { title: string; icon: typeof Shield }> = {
  income:     { title: 'Zajištění příjmů',   icon: Shield },
  housing:    { title: 'Bydlení',            icon: HomeIcon },
  retirement: { title: 'Příprava na důchod', icon: Clock },
  children:   { title: 'Děti',               icon: Baby },
  investing:  { title: 'Investice',          icon: TrendingUp },
  property:   { title: 'Pojištění majetku',  icon: Building2 },
}

/** Barvy značek nabídek ve srovnání – stejné jako u zajištění příjmu. */
const BARVY_NABIDEK = [BARVY.mint, BARVY.navy, BARVY.mintDark]

const statusConfig = {
  ok:             { label: 'V pořádku',     icon: CheckCircle2, trida: 'bg-mint/15 text-navy' },
  recommendation: { label: 'Doporučení',    icon: Target,       trida: 'bg-navy/8 text-navy' },
  action:         { label: 'Vyžaduje akci', icon: AlertCircle,  trida: 'bg-amber/25 text-navy' },
}

const interestBorderClass: Record<Exclude<InterestStatus, null>, string> = {
  interested: 'border-mint ring-2 ring-mint',
  question:   'border-navy/40',
  not_now:    'border-line opacity-60',
}


export default function FinancniPlanPage() {
  const supabase = useMemo(() => createClient(), [])
  const [clientId, setClientId] = useState<string | null>(null)
  const [planSections, setPlanSections] = useState<PlanSection[]>([])
  const [incomeVariants, setIncomeVariants] = useState<IncomeVariant[]>([])
  const [monthlyIncomeNet, setMonthlyIncomeNet] = useState<number | null>(null)
  const [selectedIncomeVariantId, setSelectedIncomeVariantId] = useState<string | null>(null)
  const [interests, setInterests] = useState<Record<string, InterestStatus>>({})
  const [selectedVariants, setSelectedVariants] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [askModal, setAskModal] = useState<{ open: boolean; section: string; label: string }>({
    open: false,
    section: '',
    label: '',
  })
  const [toast, setToast] = useState<string | null>(null)
  const [bulkLoading, setBulkLoading] = useState(false)
  const [planDatum, setPlanDatum] = useState<string | null>(null)
  const [duchod, setDuchod] = useState<VysledekDuchod | null>(null)
  const [jmenoKlienta, setJmenoKlienta] = useState<string | null>(null)
  const [zbytekHypoteky, setZbytekHypoteky] = useState<number | null>(null)
  // Současná hypotéka z analýzy – sloupec „Teď“ ve srovnání nabídek bydlení.
  const [soucasnaHypoteka, setSoucasnaHypoteka] = useState<SoucasnaHypoteka | null>(null)
  // Při tisku rozbalíme všechny varianty – zavřené harmoniky nejsou v DOM
  // a na papíře by z plánu zbyly jen názvy společností a ceny.
  const [tiskovyRezim, setTiskovyRezim] = useState(false)

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }
    setClientId(user.id)

    // Paralelně
    const [variantsRes, paramsRes, recsRes, interestRes, selectionRes, financialsRes, analyzaRes, profilRes] = await Promise.all([
      supabase.from('plan_variants').select('*').eq('client_id', user.id).order('sort_order'),
      supabase.from('plan_params').select('*').order('sort_order'),
      supabase.from('plan_recommendations').select('*').eq('client_id', user.id),
      supabase.from('plan_section_interest').select('section, status').eq('client_id', user.id),
      supabase.from('plan_variant_selection').select('variant_id').eq('client_id', user.id),
      supabase.from('client_financials').select('monthly_income_net, age, retirement_age, expected_state_pension, has_mortgage, mortgage_remaining_amount').eq('client_id', user.id).maybeSingle(),
      supabase.from('analysis_responses').select('section, question_id, value').eq('client_id', user.id).in('section', ['retirement', 'personal', 'income', 'housing']),
      supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
    ])

    setJmenoKlienta((profilRes.data as { full_name: string | null } | null)?.full_name ?? null)

    const finance = financialsRes.data as
      | {
          monthly_income_net: number | null
          age: number | null
          retirement_age: number | null
          expected_state_pension: number | null
          has_mortgage: boolean | null
          mortgage_remaining_amount: number | null
        }
      | null
    setMonthlyIncomeNet(finance?.monthly_income_net ?? null)

    // Renta v důchodu se počítá z analýzy; co poradce přepsal v kartě klienta,
    // má přednost — je to novější a ověřené číslo.
    const analyza: Record<string, Record<string, string>> = {}
    for (const r of (analyzaRes.data ?? []) as Array<{ section: string; question_id: string; value: string }>) {
      ;(analyza[r.section] ??= {})[r.question_id] = r.value
    }
    // Zbytek hypotéky je kotva u plnění při úmrtí. Číslo od poradce má
    // přednost; bez něj bereme, co klient uvedl v analýze.
    setZbytekHypoteky(
      finance?.has_mortgage && finance.mortgage_remaining_amount
        ? finance.mortgage_remaining_amount
        : analyza.housing?.housing_situation === 'Ve vlastním s hypotékou'
          ? cislo(analyza.housing.mortgage_balance) ?? null
          : null,
    )
    const bydleni = analyza.housing ?? {}
    setSoucasnaHypoteka(
      bydleni.housing_situation === 'Ve vlastním s hypotékou'
        ? { banka: bydleni.mortgage_bank || undefined, splatka: cislo(bydleni.mortgage_payment), sazba: cislo(bydleni.mortgage_rate) }
        : null,
    )
    const duchodOdpovedi = analyza.retirement ?? {}
    setDuchod(
      spoctiDuchod({
        vek: finance?.age ?? cislo(analyza.personal?.age),
        vekOdchodu: finance?.retirement_age ?? cislo(duchodOdpovedi.retirement_age),
        pozadovanaRenta: cislo(duchodOdpovedi.desired_pension),
        cistyPrijem: finance?.monthly_income_net ?? cislo(analyza.income?.monthly_income),
        statniDuchod: finance?.expected_state_pension ?? undefined,
        jizNaspořeno: cislo(duchodOdpovedi.retirement_saved),
        odkladaTed: cislo(duchodOdpovedi.current_savings),
      }),
    )

    // Income varianty s details (samostatně pro IncomeLifeChart)
    const rawIncomeVariants = (variantsRes.data || []).filter((v: { section: string }) => v.section === 'income') as Array<{
      id: string
      company: string
      logo: string
      monthly_payment: string
      details: IncomeVariant['details']
    }>
    setIncomeVariants(rawIncomeVariants.map(v => ({
      id: v.id,
      company: v.company,
      logo: v.logo || v.company[0],
      monthly_payment: v.monthly_payment,
      details: v.details ?? null,
    })))

    // Agregace do PlanSection[]
    const variants = variantsRes.data || []

    // Datum plánu = kdy poradce naposledy přidal variantu
    setPlanDatum(
      variants.reduce<string | null>((nej, v) => {
        const d = (v as { created_at?: string }).created_at
        return d && (!nej || d > nej) ? d : nej
      }, null),
    )
    const params = paramsRes.data || []
    const recs = recsRes.data || []

    const sections: PlanSection[] = []
    const order = ['income', 'housing', 'retirement', 'children', 'investing', 'property']
    for (const id of order) {
      const cfg = sectionConfig[id]
      if (!cfg) continue
      const sectionVariants = variants.filter((v: { section: string }) => v.section === id)
      const rec = recs.find((r: { section: string }) => r.section === id)
      if (sectionVariants.length > 0) {
        const mapped: Variant[] = sectionVariants.map((v: { id: string; company: string; logo: string; monthly_payment: string; details?: unknown }) => {
          const vp = params.filter((p: { variant_id: string }) => p.variant_id === v.id)
          const paramMap: Record<string, ParamDetail> = {}
          for (const p of vp as Array<{ param_label: string; value: string; note?: string }>) {
            paramMap[p.param_label] = { value: p.value, note: p.note || '' }
          }
          return {
            id: v.id,
            company: v.company,
            logo: v.logo || v.company[0],
            monthlyPayment: v.monthly_payment,
            params: paramMap,
            produkt: ctiProdukt(v.details),
          }
        })
        sections.push({ id, ...cfg, type: 'variants', variants: mapped, status: rec?.status || 'recommendation' })
      } else if (rec) {
        sections.push({ id, ...cfg, type: 'simple', items: rec.items || [], status: rec.status ?? 'recommendation' })
      }
    }
    setPlanSections(sections)

    // Interests
    const interestMap: Record<string, InterestStatus> = {}
    for (const row of (interestRes.data || []) as Array<{ section: string; status: InterestStatus }>) {
      interestMap[row.section] = row.status
    }
    setInterests(interestMap)

    // Selected variants
    const selSet = new Set<string>()
    for (const row of (selectionRes.data || []) as Array<{ variant_id: string }>) {
      selSet.add(row.variant_id)
    }
    setSelectedVariants(selSet)

    // Income – předvybraná varianta (single select)
    const incomeIds = new Set(rawIncomeVariants.map(v => v.id))
    const selectedIncome = [...selSet].find(id => incomeIds.has(id)) ?? null
    setSelectedIncomeVariantId(selectedIncome)

    setLoading(false)
  }, [supabase])

  // eslint-disable-next-line react-hooks/set-state-in-effect -- načtení plánu po připojení, stav se plní z odpovědi Supabase
  useEffect(() => { loadData() }, [loadData])

  /**
   * „Uložit jako PDF" = tiskový dialog prohlížeče. Vlastní generátor PDF by
   * znamenal další knihovnu a druhou podobu dokumentu, kterou je nutné
   * udržovat; tisková šablona žije přímo se stránkou.
   */
  async function handlePrint() {
    setTiskovyRezim(true)
    // Necháme doběhnout rozbalení harmonik, teprve pak otevřeme dialog.
    await new Promise((r) => setTimeout(r, 400))
    window.print()
    setTiskovyRezim(false)
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  /**
   * Volba jediné varianty v sekci (u bydlení: hypotéka je jedna). Kliknutí na
   * už vybranou výběr zruší – tak to posílá „Zrušit výběr“ ve VyberVarianty.
   * Poradce dostane notifikaci jako dřív u tlačítka v kartě varianty.
   */
  async function vyberJedinou(section: PlanSection, variantId: string) {
    if (!clientId || !section.variants) return
    const ids = section.variants.map((v) => v.id)
    const predchozi = ids.find((id) => selectedVariants.has(id)) ?? null
    const { error: chybaMazani } = await supabase
      .from('plan_variant_selection')
      .delete()
      .eq('client_id', clientId)
      .in('variant_id', ids)
    if (chybaMazani) return showToast('Výběr se nepodařilo uložit. Zkuste to prosím znovu.')

    const dalsi = new Set(selectedVariants)
    ids.forEach((id) => dalsi.delete(id))
    if (predchozi !== variantId) {
      const { error } = await supabase.from('plan_variant_selection').insert({ client_id: clientId, variant_id: variantId })
      if (error) {
        setSelectedVariants(dalsi)
        return showToast('Výběr se nepodařilo uložit. Zkuste to prosím znovu.')
      }
      dalsi.add(variantId)
      const zvolena = section.variants.find((v) => v.id === variantId)
      notifyAdvisor({ event: 'variant_selected', client_id: clientId, variant_id: variantId, company: zvolena?.company, section: section.id })
      if (zvolena) showToast(`${zvolena.company} označena jako preferovaná. Poradce vás zkontaktuje.`)
    }
    setSelectedVariants(dalsi)
  }

  async function handleBulkInterest() {
    if (!clientId || bulkLoading) return
    setBulkLoading(true)

    const rows = planSections.map(s => ({
      client_id: clientId,
      section: s.id,
      status: 'interested' as const,
      updated_at: new Date().toISOString(),
    }))
    const { error } = await supabase.from('plan_section_interest').upsert(rows, {
      onConflict: 'client_id,section',
    })

    if (!error) {
      const next: Record<string, InterestStatus> = {}
      for (const s of planSections) next[s.id] = 'interested'
      setInterests(next)
      notifyAdvisor({
        event: 'bulk_plan_interest',
        client_id: clientId,
        sections: planSections.map(s => s.id),
      })
      showToast('Poradce bude informován o vašem zájmu o celý plán.')
    }
    setBulkLoading(false)
  }

  // Varianty zajištění příjmu, u kterých poradce vyplnil detail produktu.
  const produktyPrijmu = incomeVariants
    .map((v) => ({ id: v.id, company: v.company, produkt: ctiProdukt(v.details) }))
    .filter((v): v is { id: string; company: string; produkt: ProduktVarianty } => v.produkt !== null)

  const hasPlan = planSections.length > 0
  const allInterested =
    hasPlan && planSections.every(s => interests[s.id] === 'interested')

  return (
    <div>
      <TiskovaTitulka jmenoKlienta={jmenoKlienta} datum={planDatum} />

      <header className="bez-tisku mb-10">
        <h1 className="font-display text-h2 text-navy">Váš finanční plán</h1>
        <p className="mt-3 text-base text-slate">
          Připravil {PORADCE.jmeno}
          {planDatum ? ` · ${formatDate(planDatum)}` : ''}
        </p>
        <p className="mt-4 text-lead text-slate max-w-2xl text-pretty">
          U každé oblasti mi dejte vědět, jestli chcete pokračovat, nebo máte otázku.
        </p>
      </header>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-surface rounded-card border border-line p-6 animate-pulse">
              <div className="h-6 bg-cream rounded w-1/3 mb-3" />
              <div className="h-4 bg-cream rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : !hasPlan ? (
        <div className="bg-surface rounded-card border border-line p-12 md:p-16 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-card bg-mint/15 mb-5">
            <FileText className="w-8 h-8 text-navy" strokeWidth={1.5} />
          </div>
          <h2 className="font-display text-h3 text-navy mb-2">Plán se připravuje</h2>
          <p className="text-base text-slate mb-7 max-w-md mx-auto">
            Jakmile vyplníte finanční analýzu, připravím vám osobní plán obvykle do 48 hodin.
          </p>
          <Link href="/dashboard/analyza" className={buttonVariants({ size: 'lg' })}>
            Vyplnit analýzu
          </Link>
        </div>
      ) : (
        <>
          {/* Souhrn plánu. Bez gradientu i zrna — hloubku dělá plocha, ne efekt. */}
          <div className="rounded-card bg-navy text-cream p-6 md:p-8 mb-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
              <div>
                <h2 className="font-display text-h3 text-cream">
                  Plán pokrývá {planSections.length} {plural(planSections.length, 'oblast', 'oblasti', 'oblastí')}
                </h2>
                <p className="text-base text-cream/70 mt-2">
                  Projděte si je a u každé řekněte, jestli chcete pokračovat.
                </p>
              </div>
              <div className="bez-tisku flex flex-col sm:flex-row gap-2.5 shrink-0">
                <Button type="button" onClick={handleBulkInterest} disabled={bulkLoading || allInterested}>
                  {bulkLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                  ) : allInterested ? (
                    <CheckCircle2 className="w-4 h-4" aria-hidden />
                  ) : (
                    <Sparkles className="w-4 h-4" aria-hidden />
                  )}
                  {allInterested ? 'Zájem potvrzen' : 'Mám zájem o celý plán'}
                </Button>
                <Button type="button" variant="onDark" onClick={handlePrint}>
                  <Download className="w-4 h-4" aria-hidden />
                  Uložit jako PDF
                </Button>
              </div>
            </div>
          </div>

          {/* Vizuální přehled – radar pokrytí + donut nákladů + srovnání variant */}
          {hasPlan && <FinancialPlanOverview sections={planSections} />}

          {/* Plan sections */}
          <div className="space-y-4">
            {planSections.map((section) => {
              const status = statusConfig[section.status]
              const currentInterest = interests[section.id] ?? null
              const interestClass =
                currentInterest ? interestBorderClass[currentInterest] : 'border-line'
              return (
                <div
                  key={section.id}
                  className={`tisk-pohromade bg-surface rounded-card border border-l-4 border-l-mint p-5 md:p-6 shadow-card transition-colors ${interestClass}`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-input bg-navy flex items-center justify-center">
                      <section.icon className="w-5 h-5 text-cream" strokeWidth={1.8} aria-hidden />
                    </div>
                    <h3 className="font-display text-navy flex-1 text-h3">
                      {section.title}
                    </h3>
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-pill text-base ${status.trida}`}>
                      <status.icon className="w-4 h-4" aria-hidden />
                      {status.label}
                    </div>
                  </div>

                  <div className="h-px bg-line mb-4" />

                  {section.id === 'retirement' && duchod && (
                    <div className="mb-5">
                      <DuchodVCislech v={duchod} />
                    </div>
                  )}

                  {section.id === 'income' ? (
                    <>
                    <IncomeLifeChart
                      monthlyIncomeNet={monthlyIncomeNet}
                      zbytekHypoteky={zbytekHypoteky}
                      variants={incomeVariants}
                      selectedVariantId={selectedIncomeVariantId}
                      onSelect={async (variantId) => {
                        if (!clientId) return
                        // Single-select pro income – nahradíme jakoukoli předchozí volbu
                        const previousIncomeIds = incomeVariants.map(v => v.id)
                        await supabase.from('plan_variant_selection')
                          .delete()
                          .eq('client_id', clientId)
                          .in('variant_id', previousIncomeIds)
                        if (selectedIncomeVariantId !== variantId) {
                          await supabase.from('plan_variant_selection').insert({
                            client_id: clientId,
                            variant_id: variantId,
                          })
                          setSelectedIncomeVariantId(variantId)
                          setSelectedVariants(prev => {
                            const next = new Set(prev)
                            previousIncomeIds.forEach(id => next.delete(id))
                            next.add(variantId)
                            return next
                          })
                          const chosen = incomeVariants.find(v => v.id === variantId)
                          if (chosen) showToast(`${chosen.company} označena jako preferovaná. Poradce vás zkontaktuje.`)
                        } else {
                          // Odznačení
                          setSelectedIncomeVariantId(null)
                          setSelectedVariants(prev => {
                            const next = new Set(prev)
                            previousIncomeIds.forEach(id => next.delete(id))
                            return next
                          })
                        }
                      }}
                    />
                    {/* Graf u zajištění příjmu nemá rozklikávací karty variant,
                        takže detail produktu – hlavně kontakt na hlášení události –
                        vypisujeme pod ním. */}
                    {produktyPrijmu.length > 0 && (
                      <div className="mt-5 space-y-3">
                        {produktyPrijmu.map(({ id, company, produkt }) => (
                          <PopisProduktu key={id} produkt={produkt} firma={company} />
                        ))}
                      </div>
                    )}
                    </>
                  ) : section.id === 'housing' && section.variants ? (
                    (() => {
                      const vybrana = section.variants.find((v) => selectedVariants.has(v.id))?.id ?? null
                      return (
                        <div className="space-y-5">
                          <SrovnaniNabidek
                            nabidky={section.variants.map((v) => ({
                              id: v.id,
                              company: v.company,
                              logo: v.logo,
                              monthlyPayment: v.monthlyPayment,
                              params: v.params,
                              produkt: v.produkt?.nazev,
                            }))}
                            ted={soucasnaHypoteka}
                            barvy={BARVY_NABIDEK}
                            selectedId={vybrana}
                          />
                          <VyberVarianty
                            variants={section.variants.map((v) => ({
                              id: v.id,
                              company: v.company,
                              logo: v.logo,
                              monthly_payment: v.monthlyPayment,
                              produkt: v.produkt?.nazev,
                            }))}
                            barvy={BARVY_NABIDEK}
                            selectedId={vybrana}
                            onSelect={(id) => vyberJedinou(section, id)}
                            nadpis="Kterou nabídku chcete?"
                          />
                          {/* Karty variant tu nejsou, detail produktu (hlavně kontakt) jde pod výběr. */}
                          {section.variants.map((v) =>
                            v.produkt ? <PopisProduktu key={v.id} produkt={v.produkt} firma={v.company} /> : null,
                          )}
                        </div>
                      )
                    })()
                  ) : section.type === 'variants' && section.variants ? (
                    <div className="space-y-3">
                      <p className="text-base text-slate mb-1">
                        {section.variants.length} varian{section.variants.length === 1 ? 'ta' : 'ty'} k porovnání – rozklikněte detail nebo označte tu, o kterou máte zájem.
                      </p>
                      {section.variants.map((variant, i) => (
                        <VariantCardInteractive
                          key={variant.id}
                          variant={variant}
                          index={i}
                          forceOpen={tiskovyRezim}
                          clientId={clientId ?? ''}
                          section={section.id}
                          isSelected={selectedVariants.has(variant.id)}
                          onToggleSelect={(sel) => {
                            setSelectedVariants(prev => {
                              const next = new Set(prev)
                              if (sel) next.add(variant.id)
                              else next.delete(variant.id)
                              return next
                            })
                            if (sel) showToast(`${variant.company} označena jako preferovaná. Poradce vás zkontaktuje.`)
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    <ul className="space-y-2.5">
                      {section.items?.map((item, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-base text-navy/85 leading-relaxed">
                          <div className="w-1.5 h-1.5 rounded-full bg-mint mt-2 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}

                  {clientId && (
                    <SectionInterestToolbar
                      clientId={clientId}
                      section={section.id}
                      sectionLabel={section.title}
                      status={currentInterest}
                      onStatusChange={(next) => {
                        setInterests(prev => ({ ...prev, [section.id]: next }))
                        if (next === 'interested') showToast('Poradce dostane notifikaci.')
                      }}
                      onAskQuestion={() =>
                        setAskModal({ open: true, section: section.id, label: section.title })
                      }
                    />
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}

      {hasPlan && <TiskovyZaver datum={planDatum} />}

      {/* Ask modal */}
      {clientId && (
        <AskModal
          open={askModal.open}
          onClose={() => setAskModal(s => ({ ...s, open: false }))}
          clientId={clientId}
          section={askModal.section}
          sectionLabel={askModal.label}
          onSent={() => {
            setInterests(prev => ({ ...prev, [askModal.section]: 'question' }))
            showToast('Dotaz odeslán poradci. Odpověď najdete v chatu.')
          }}
        />
      )}

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          // Na střed přes inset-x-0 a mx-auto, ne left-1/2 s posunem: prvek s pevnou
          // pozicí od poloviny obrazovky smí být široký jen polovinu a zpráva se
          // na telefonu lámala do šesti řádků. Nad spodní lištou navigace.
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="bez-tisku fixed bottom-24 lg:bottom-6 inset-x-0 mx-auto w-fit z-40 bg-navy text-cream text-base px-5 py-3 rounded-pill shadow-card flex items-center gap-3 max-w-[92vw]"
          >
            <CheckCircle2 className="w-4 h-4 text-mint shrink-0" aria-hidden />
            <span className="min-w-0">{toast}</span>
            <button
              onClick={() => setToast(null)}
              className="text-cream/60 hover:text-cream transition-colors shrink-0"
              aria-label="Zavřít"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * Co to je za produkt, do kdy běží a kam volat při pojistné události.
 * Kontakty jsou tu hlavně kvůli vytištěnému plánu — klient, který si za tři
 * roky zlomí nohu, má číslo po ruce, aniž by hledal smlouvu.
 */
function PopisProduktu({ produkt, firma }: { produkt: ProduktVarianty; firma?: string }) {
  const udaje = [
    produkt.doVeku && (['Běží do', produkt.doVeku] as const),
    produkt.frekvence && (['Platí se', produkt.frekvence] as const),
  ].filter(Boolean) as ReadonlyArray<readonly [string, string]>

  const kontakty = [
    produkt.hlaseni && (['Hlášení pojistné události', produkt.hlaseni] as const),
    produkt.kontakt && (['Platby a změny', produkt.kontakt] as const),
  ].filter(Boolean) as ReadonlyArray<readonly [string, string]>

  // Na papíře je odkaz k ničemu, telefon se musí opisovat. QR kódy proto
  // jen do tisku — na obrazovce stačí odkaz, na který jde kliknout.
  const kodyDoTisku = kontakty
    .map(([popisek, hodnota]) => ({ popisek, odkaz: odkazNaKontakt(hodnota) }))
    .filter((x): x is { popisek: string; odkaz: { href: string; popisek: string } } => x.odkaz !== null)

  return (
    <div className="mb-3 rounded-card bg-cream border border-line p-4">
      {firma && <p className="text-base text-slate">{firma}</p>}
      {produkt.nazev && <h5 className="font-display text-navy">{produkt.nazev}</h5>}
      {produkt.popis && (
        <p className="text-base text-slate mt-1.5 text-pretty">{produkt.popis}</p>
      )}

      {udaje.length > 0 && (
        <dl className="mt-3 flex flex-wrap gap-x-8 gap-y-1.5">
          {udaje.map(([popisek, hodnota]) => (
            <div key={popisek} className="flex items-baseline gap-2">
              <dt className="text-base text-slate">{popisek}</dt>
              <dd className="text-base text-navy">{hodnota}</dd>
            </div>
          ))}
        </dl>
      )}

      {kontakty.length > 0 && (
        <ul className="mt-3 pt-3 border-t border-line space-y-1.5">
          {kontakty.map(([popisek, hodnota]) => {
            const odkaz = odkazNaKontakt(hodnota)
            return (
              <li key={popisek} className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-base text-slate">{popisek}:</span>
                {odkaz ? (
                  <a
                    href={odkaz.href}
                    target={odkaz.href.startsWith('http') ? '_blank' : undefined}
                    rel={odkaz.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="text-base text-navy underline underline-offset-4 hover:text-mint-dark rounded-pill focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40 break-all"
                  >
                    {odkaz.popisek}
                  </a>
                ) : (
                  <span className="text-base text-navy break-all">{hodnota}</span>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {kodyDoTisku.length > 0 && (
        <div className="jen-tisk mt-4 pt-3 border-t border-line">
          <div className="flex flex-wrap gap-6">
            {kodyDoTisku.map(({ popisek, odkaz }) => (
              <figure key={popisek}>
                <QRCodeSVG
                  value={odkaz.href}
                  size={84}
                  level="M"
                  bgColor={BARVY.surface}
                  fgColor={BARVY.navy}
                />
                <figcaption className="text-base text-slate mt-1.5 max-w-[84px] text-pretty">
                  {popisek}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/** „2 500 000 Kč" → 2500000. Prázdné nebo nečíselné → undefined. */
function cislo(v: string | undefined): number | undefined {
  if (!v) return undefined
  const n = Number.parseFloat(v.replace(/[^\d,.-]/g, '').replace(',', '.'))
  return Number.isFinite(n) ? n : undefined
}

// Interactive variant card – with "Select this variant" CTA
function VariantCardInteractive({
  variant,
  index,
  clientId,
  section,
  isSelected,
  onToggleSelect,
  forceOpen = false,
}: {
  variant: Variant
  index: number
  clientId: string
  section: string
  isSelected: boolean
  onToggleSelect: (selected: boolean) => void
  /** Tisk rozbalí všechny varianty, ať je na papíře i to, co je pod detailem. */
  forceOpen?: boolean
}) {
  const [rozbaleno, setRozbaleno] = useState(false)
  const open = rozbaleno || forceOpen
  const setOpen = setRozbaleno
  return (
    <div
      className={`rounded-card overflow-hidden transition-all border ${
        isSelected
          ? 'border-mint bg-mint/5 ring-2 ring-mint'
          : open
          ? 'border-mint/40 bg-surface'
          : 'border-line bg-surface hover:border-mint/40 hover:shadow-sm'
      }`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-4 p-4 text-left transition-colors"
      >
        <div className="w-11 h-11 rounded-input bg-navy flex items-center justify-center text-cream font-semibold text-lg shrink-0">
          {variant.logo}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-navy text-base">{variant.company}</h4>
          <p className="text-xs tracking-[0.15em] uppercase text-slate mt-0.5">
            Varianta {index + 1}
          </p>
        </div>
        <div className="text-right flex-shrink-0 mr-2 hidden sm:block">
          <span className="font-display text-navy text-xl">{variant.monthlyPayment}</span>
          <p className="text-xs tracking-[0.1em] uppercase text-slate">/ měsíc</p>
        </div>
        {open ? (
          <ChevronUp className="w-5 h-5 text-navy" strokeWidth={1.8} />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate" strokeWidth={1.8} />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              <div className="h-px bg-line mb-3" />

              {variant.produkt && <PopisProduktu produkt={variant.produkt} />}

              <div className="space-y-2">
                {Object.entries(variant.params).map(([key, detail]) => (
                  <div
                    key={key}
                    className="bg-cream rounded-card px-4 py-3 border border-line"
                  >
                    <div className="flex items-center justify-between mb-1 gap-3">
                      <span className="text-base font-medium text-navy/80">{key}</span>
                      <span className="text-base font-semibold text-navy bg-cream border border-line px-3 py-0.5 rounded-card">
                        {detail.value}
                      </span>
                    </div>
                    {detail.note && (
                      <p className="text-base text-slate leading-relaxed mt-1">{detail.note}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Select CTA – always visible when detail is open */}
              <div className="flex items-center justify-end mt-4 pt-3 border-t border-line">
                <SelectVariantButton
                  clientId={clientId}
                  variantId={variant.id}
                  company={variant.company}
                  section={section}
                  isSelected={isSelected}
                  onToggle={onToggleSelect}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
