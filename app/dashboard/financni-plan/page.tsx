'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft, FileText, Download, Clock, Shield, TrendingUp,
  Home as HomeIcon, Baby, Building2, ChevronDown, ChevronUp,
  CheckCircle2, AlertCircle, Target, Sparkles, Loader2, X,
} from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import SectionInterestToolbar, { type InterestStatus } from '@/components/dashboard/SectionInterestToolbar'
import AskModal from '@/components/dashboard/AskModal'
import SelectVariantButton from '@/components/dashboard/SelectVariantButton'

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
  gradient: string
  type: 'variants' | 'simple'
  variants?: Variant[]
  items?: string[]
  status: 'ok' | 'recommendation' | 'action'
}

const sectionConfig: Record<string, { title: string; icon: typeof Shield; gradient: string }> = {
  income:     { title: 'Zajištění příjmů', icon: Shield,     gradient: 'from-[#162459] to-[#243471]' },
  housing:    { title: 'Bydlení',          icon: HomeIcon,   gradient: 'from-[#009EE2] to-[#0088c6]' },
  retirement: { title: 'Příprava na důchod', icon: Clock,    gradient: 'from-[#162459] to-[#009EE2]' },
  children:   { title: 'Děti',             icon: Baby,       gradient: 'from-[#009EE2] to-[#0088c6]' },
  investing:  { title: 'Investice',        icon: TrendingUp, gradient: 'from-[#162459] to-[#243471]' },
  property:   { title: 'Pojištění majetku', icon: Building2, gradient: 'from-[#009EE2] to-[#0088c6]' },
}

const companyColors: Record<string, string> = {
  Kooperativa: 'from-green-600 to-green-700',
  'ČPP': 'from-red-600 to-red-700',
  MetLife: 'from-blue-700 to-blue-800',
  Allianz: 'from-blue-600 to-indigo-700',
  Generali: 'from-red-700 to-rose-800',
  NN: 'from-orange-500 to-orange-600',
  Uniqa: 'from-purple-600 to-purple-700',
}

const statusConfig = {
  ok:             { label: 'V pořádku',    icon: CheckCircle2, color: '#15803d', bg: 'rgba(22,163,74,0.10)',  border: 'rgba(22,163,74,0.30)'  },
  recommendation: { label: 'Doporučení',    icon: Target,       color: '#0088c6', bg: 'rgba(0,158,226,0.10)',  border: 'rgba(0,158,226,0.30)'  },
  action:         { label: 'Vyžaduje akci', icon: AlertCircle,  color: '#b45309', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.35)' },
}

const interestBorderClass: Record<Exclude<InterestStatus, null>, string> = {
  interested: 'border-[#009EE2] shadow-[inset_0_0_0_1px_#009EE2]',
  question:   'border-[#162459]/40',
  not_now:    'border-[#E8E9EE] opacity-60',
}

const WEBHOOK_URL = 'https://n8n.jevcakn8n.com/webhook/klient-zajem'

export default function FinancniPlanPage() {
  const supabase = useMemo(() => createClient(), [])
  const [clientId, setClientId] = useState<string | null>(null)
  const [planSections, setPlanSections] = useState<PlanSection[]>([])
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

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }
    setClientId(user.id)

    // Paralelně
    const [variantsRes, paramsRes, recsRes, interestRes, selectionRes] = await Promise.all([
      (supabase.from('plan_variants') as any).select('*').eq('client_id', user.id).order('sort_order'),
      (supabase.from('plan_params') as any).select('*').order('sort_order'),
      (supabase.from('plan_recommendations') as any).select('*').eq('client_id', user.id),
      (supabase.from('plan_section_interest') as any).select('section, status').eq('client_id', user.id),
      (supabase.from('plan_variant_selection') as any).select('variant_id').eq('client_id', user.id),
    ])

    // Agregace do PlanSection[]
    const variants = variantsRes.data || []
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
        sections.push({ id, ...cfg, type: 'simple', items: rec.items || [], status: rec.status })
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

    setLoading(false)
  }, [supabase])

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
    const { error } = await (supabase.from('plan_section_interest') as any).upsert(rows, {
      onConflict: 'client_id,section',
    })

    if (!error) {
      const next: Record<string, InterestStatus> = {}
      for (const s of planSections) next[s.id] = 'interested'
      setInterests(next)
      try {
        fetch(WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'bulk_plan_interest',
            client_id: clientId,
            sections: planSections.map(s => s.id),
            created_at: new Date().toISOString(),
          }),
        })
      } catch {}
      showToast('Poradce bude informován o vašem zájmu o celý plán.')
    }
    setBulkLoading(false)
  }

  const hasPlan = planSections.length > 0
  const allInterested =
    hasPlan && planSections.every(s => interests[s.id] === 'interested')

  return (
    <div className="max-w-5xl mx-auto px-6 md:px-10 lg:px-16 xl:px-20 py-10 md:py-14">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="mb-10"
      >
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-[#818EAF] hover:text-[#162459] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Zpět
        </Link>
        <div className="section-numeral text-[3rem] md:text-[4.5rem] mb-2">04</div>
        <p className="text-xs tracking-[0.3em] uppercase text-[#818EAF] mb-2">Plán · na míru vám</p>
        <h1
          className="font-display text-[#162459]"
          style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.02em', lineHeight: 1.05 }}
        >
          Finanční <span style={{ fontStyle: 'italic', color: '#009EE2' }}>plán</span>
        </h1>
        <p className="text-[#818EAF] mt-3 max-w-xl leading-relaxed">
          Váš osobní plán od certifikovaného poradce. Prohlédněte si doporučení — u každé oblasti řekněte, zda
          chcete pokračovat nebo máte otázky.
        </p>
      </motion.div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-3xl border border-[#E8E9EE] p-6 animate-pulse">
              <div className="h-6 bg-[#f8f9fc] rounded w-1/3 mb-3" />
              <div className="h-4 bg-[#f8f9fc] rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : !hasPlan ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl border border-[#E8E9EE] p-12 md:p-16 text-center"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#009EE2]/10 border border-[#009EE2]/25 mb-5">
            <FileText className="w-8 h-8 text-[#0088c6]" strokeWidth={1.5} />
          </div>
          <h2 className="font-display text-[#162459] mb-2" style={{ fontSize: '1.4rem', letterSpacing: '-0.01em' }}>
            Plán se <span style={{ fontStyle: 'italic', color: '#009EE2' }}>připravuje</span>
          </h2>
          <p className="text-[#818EAF] mb-7 max-w-md mx-auto leading-relaxed">
            Jakmile vyplníte finanční analýzu, poradce připraví osobní plán obvykle do 48 hodin.
          </p>
          <Link
            href="/dashboard/analyza"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-white text-[15px] transition-all hover:shadow-lg hover:shadow-[#009EE2]/25 hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg, #009EE2, #0088c6)' }}
          >
            Vyplnit analýzu
          </Link>
        </motion.div>
      ) : (
        <>
          {/* Summary card — mega CTA + PDF */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="relative rounded-3xl p-6 md:p-8 mb-10 overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #0e1a3d 0%, #162459 55%, #243471 100%)' }}
          >
            <div className="noise-overlay" aria-hidden />
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(500px circle at 90% 90%, rgba(0,158,226,0.25), transparent 55%)' }}
            />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
              <div>
                <p className="text-xs tracking-[0.3em] uppercase text-[#009EE2]/70 mb-2">
                  Plán · {planSections.length} oblast{planSections.length > 1 ? 'í' : ''}
                </p>
                <h2
                  className="font-display text-white"
                  style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', letterSpacing: '-0.02em', lineHeight: 1.1 }}
                >
                  Komplexní <span style={{ fontStyle: 'italic', color: '#009EE2' }}>plán</span>
                </h2>
                <p className="text-white/55 text-sm mt-2">
                  Projděte si sekce níže a u každé řekněte, zda chcete pokračovat.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={handleBulkInterest}
                  disabled={bulkLoading || allInterested}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-[15px] transition-all disabled:opacity-60 shadow-sm"
                  style={{
                    background: allInterested
                      ? 'rgba(0,158,226,0.18)'
                      : 'linear-gradient(135deg, #009EE2, #0088c6)',
                    color: allInterested ? '#a0dff5' : 'white',
                  }}
                >
                  {bulkLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : allInterested ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  {allInterested ? 'Zájem potvrzen' : 'Mám zájem o celý plán'}
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-[#162459] bg-white hover:bg-white/90 transition-all"
                >
                  <Download className="w-4 h-4" />
                  PDF
                </button>
              </div>
            </div>
          </motion.div>

          {/* Plan sections */}
          <div className="space-y-4">
            {planSections.map((section, idx) => {
              const status = statusConfig[section.status]
              const currentInterest = interests[section.id] ?? null
              const interestClass =
                currentInterest ? interestBorderClass[currentInterest] : 'border-[#E8E9EE]'
              return (
                <motion.div
                  key={section.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 + idx * 0.07, ease: [0.22, 1, 0.36, 1] }}
                  className={`bg-white rounded-3xl border p-5 md:p-6 hover:shadow-[0_10px_30px_-10px_rgba(22,36,89,0.1)] transition-all ${interestClass}`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${section.gradient} flex items-center justify-center shadow-sm`}>
                      <section.icon className="w-5 h-5 text-white" strokeWidth={1.8} />
                    </div>
                    <h3 className="font-display text-[#162459] flex-1" style={{ fontSize: '1.1rem', letterSpacing: '-0.01em' }}>
                      {section.title}
                    </h3>
                    <div
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium"
                      style={{ background: status.bg, borderColor: status.border, color: status.color }}
                    >
                      <status.icon className="w-3.5 h-3.5" />
                      {status.label}
                    </div>
                  </div>

                  <div className="h-px bg-[#E8E9EE] mb-4" />

                  {section.type === 'variants' && section.variants ? (
                    <div className="space-y-3">
                      <p className="text-sm text-[#818EAF] mb-1">
                        {section.variants.length} varian{section.variants.length === 1 ? 'ta' : 'ty'} k porovnání — rozklikněte detail nebo označte tu, o kterou máte zájem.
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
                        <li key={i} className="flex items-start gap-2.5 text-[14px] text-[#162459]/85 leading-relaxed">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#009EE2] mt-2 flex-shrink-0" />
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
            className="fixed bottom-6 left-1/2 z-40 bg-[#162459] text-white text-sm px-5 py-3 rounded-full shadow-xl flex items-center gap-3 max-w-[92vw]"
          >
            <CheckCircle2 className="w-4 h-4 text-[#009EE2] shrink-0" />
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

// Interactive variant card — with "Select this variant" CTA
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
  const gradient = companyColors[variant.company] || 'from-[#162459] to-[#243471]'
  return (
    <div
      className={`rounded-2xl overflow-hidden transition-all border ${
        isSelected
          ? 'border-[#009EE2] bg-[#009EE2]/5 shadow-[inset_0_0_0_1px_#009EE2]'
          : open
          ? 'border-[#009EE2]/40 bg-white'
          : 'border-[#E8E9EE] bg-white hover:border-[#009EE2]/40 hover:shadow-sm'
      }`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-4 p-4 text-left transition-colors"
      >
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-sm`}>
          {variant.logo}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-[#162459] text-[15px]">{variant.company}</h4>
          <p className="text-[11px] tracking-[0.15em] uppercase text-[#818EAF] mt-0.5">
            Varianta {index + 1}
          </p>
        </div>
        <div className="text-right flex-shrink-0 mr-2 hidden sm:block">
          <span className="font-display text-[#162459] text-xl">{variant.monthlyPayment}</span>
          <p className="text-[11px] tracking-[0.1em] uppercase text-[#818EAF]">/ měsíc</p>
        </div>
        {open ? (
          <ChevronUp className="w-5 h-5 text-[#0088c6]" strokeWidth={1.8} />
        ) : (
          <ChevronDown className="w-5 h-5 text-[#818EAF]" strokeWidth={1.8} />
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
              <div className="h-px bg-[#E8E9EE] mb-3" />
              <div className="space-y-2">
                {Object.entries(variant.params).map(([key, detail]) => (
                  <div
                    key={key}
                    className="bg-white/70 backdrop-blur-sm rounded-xl px-4 py-3 border border-[#E8E9EE]"
                  >
                    <div className="flex items-center justify-between mb-1 gap-3">
                      <span className="text-[13px] font-medium text-[#162459]/80">{key}</span>
                      <span className="text-sm font-semibold text-[#162459] bg-[#f8f9fc] border border-[#E8E9EE] px-3 py-0.5 rounded-md">
                        {detail.value}
                      </span>
                    </div>
                    {detail.note && (
                      <p className="text-xs text-[#818EAF] leading-relaxed mt-1">{detail.note}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Select CTA — always visible when detail is open */}
              <div className="flex items-center justify-end mt-4 pt-3 border-t border-[#E8E9EE]">
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
