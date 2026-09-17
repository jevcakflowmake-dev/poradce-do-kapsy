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

interface ParamDetail { value: string; note: string }
interface Variant {
  id: string
  company: string
  logo: string
  monthlyPayment: string
  params: Record<string, ParamDetail>
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

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }
    setClientId(user.id)

    // Paralelně
    const [variantsRes, paramsRes, recsRes, interestRes, selectionRes, financialsRes] = await Promise.all([
      supabase.from('plan_variants').select('*').eq('client_id', user.id).order('sort_order'),
      supabase.from('plan_params').select('*').order('sort_order'),
      supabase.from('plan_recommendations').select('*').eq('client_id', user.id),
      supabase.from('plan_section_interest').select('section, status').eq('client_id', user.id),
      supabase.from('plan_variant_selection').select('variant_id').eq('client_id', user.id),
      supabase.from('client_financials').select('monthly_income_net').eq('client_id', user.id).maybeSingle(),
    ])

    setMonthlyIncomeNet((financialsRes.data as { monthly_income_net: number | null } | null)?.monthly_income_net ?? null)

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
        const mapped: Variant[] = sectionVariants.map((v: { id: string; company: string; logo: string; monthly_payment: string }) => {
          const vp = params.filter((p: { variant_id: string }) => p.variant_id === v.id)
          const paramMap: Record<string, ParamDetail> = {}
          for (const p of vp as Array<{ param_label: string; value: string; note?: string }>) {
            paramMap[p.param_label] = { value: p.value, note: p.note || '' }
          }
          return { id: v.id, company: v.company, logo: v.logo || v.company[0], monthlyPayment: v.monthly_payment, params: paramMap }
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

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
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

  const hasPlan = planSections.length > 0
  const allInterested =
    hasPlan && planSections.every(s => interests[s.id] === 'interested')

  return (
    <div>
      <header className="mb-10">
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
              <div className="flex flex-col sm:flex-row gap-2.5 shrink-0">
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
                <Button type="button" variant="onDark">
                  <Download className="w-4 h-4" aria-hidden />
                  PDF
                </Button>
              </div>
            </div>
          </div>

          {/* Vizuální přehled – radar pokrytí + donut nákladů + srovnání variant */}
          {hasPlan && <FinancialPlanOverview sections={planSections} />}

          {/* Plan sections */}
          <div className="space-y-4">
            {planSections.map((section, idx) => {
              const status = statusConfig[section.status]
              const currentInterest = interests[section.id] ?? null
              const interestClass =
                currentInterest ? interestBorderClass[currentInterest] : 'border-line'
              return (
                <motion.div
                  key={section.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 + idx * 0.07, ease: [0.22, 1, 0.36, 1] }}
                  className={`bg-surface rounded-card border border-l-4 border-l-mint p-5 md:p-6 shadow-card transition-colors ${interestClass}`}
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

                  {section.id === 'income' ? (
                    <IncomeLifeChart
                      monthlyIncomeNet={monthlyIncomeNet}
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
                  ) : section.type === 'variants' && section.variants ? (
                    <div className="space-y-3">
                      <p className="text-sm text-slate mb-1">
                        {section.variants.length} varian{section.variants.length === 1 ? 'ta' : 'ty'} k porovnání – rozklikněte detail nebo označte tu, o kterou máte zájem.
                      </p>
                      {section.variants.map((variant, i) => (
                        <VariantCardInteractive
                          key={variant.id}
                          variant={variant}
                          index={i}
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
                        <li key={i} className="flex items-start gap-2.5 text-[14px] text-navy/85 leading-relaxed">
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
                </motion.div>
              )
            })}
          </div>
        </>
      )}

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
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-6 left-1/2 z-40 bg-navy text-white text-sm px-5 py-3 rounded-full shadow-xl flex items-center gap-3 max-w-[92vw]"
          >
            <CheckCircle2 className="w-4 h-4 text-navy shrink-0" />
            <span className="min-w-0">{toast}</span>
            <button
              onClick={() => setToast(null)}
              className="text-white/50 hover:text-white transition-colors shrink-0"
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

// Interactive variant card – with "Select this variant" CTA
function VariantCardInteractive({
  variant,
  index,
  clientId,
  section,
  isSelected,
  onToggleSelect,
}: {
  variant: Variant
  index: number
  clientId: string
  section: string
  isSelected: boolean
  onToggleSelect: (selected: boolean) => void
}) {
  const [open, setOpen] = useState(false)
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
          <h4 className="font-semibold text-navy text-[15px]">{variant.company}</h4>
          <p className="text-[11px] tracking-[0.15em] uppercase text-slate mt-0.5">
            Varianta {index + 1}
          </p>
        </div>
        <div className="text-right flex-shrink-0 mr-2 hidden sm:block">
          <span className="font-display text-navy text-xl">{variant.monthlyPayment}</span>
          <p className="text-[11px] tracking-[0.1em] uppercase text-slate">/ měsíc</p>
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
              <div className="space-y-2">
                {Object.entries(variant.params).map(([key, detail]) => (
                  <div
                    key={key}
                    className="bg-white/70 backdrop-blur-sm rounded-card px-4 py-3 border border-line"
                  >
                    <div className="flex items-center justify-between mb-1 gap-3">
                      <span className="text-[13px] font-medium text-navy/80">{key}</span>
                      <span className="text-sm font-semibold text-navy bg-cream border border-line px-3 py-0.5 rounded-card">
                        {detail.value}
                      </span>
                    </div>
                    {detail.note && (
                      <p className="text-xs text-slate leading-relaxed mt-1">{detail.note}</p>
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
