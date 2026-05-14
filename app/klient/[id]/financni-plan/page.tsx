'use client'

import { useState, useEffect, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft, FileText, Download, Clock, Shield, TrendingUp,
  Home as HomeIcon, Baby, Building2, ChevronDown, ChevronUp,
  CheckCircle2, AlertCircle, Target
} from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { createClient } from '@/lib/supabase/client'

interface ParamDetail { value: string; note: string }
interface Variant { company: string; logo: string; monthlyPayment: string; params: Record<string, ParamDetail> }
interface Recommendation { section: string; status: 'ok' | 'recommendation' | 'action'; items: string[] }
interface PlanSection {
  id: string; title: string; icon: typeof Shield; gradient: string
  type: 'variants' | 'simple'
  variants?: Variant[]
  items?: string[]
  status: 'ok' | 'recommendation' | 'action'
}

const sectionConfig: Record<string, { title: string; icon: typeof Shield; gradient: string }> = {
  income: { title: 'Zajištění příjmů', icon: Shield, gradient: 'from-[#162459] to-[#243471]' },
  housing: { title: 'Bydlení', icon: HomeIcon, gradient: 'from-[#009EE2] to-[#0088c6]' },
  retirement: { title: 'Příprava na důchod', icon: Clock, gradient: 'from-[#162459] to-[#009EE2]' },
  children: { title: 'Děti', icon: Baby, gradient: 'from-[#009EE2] to-[#0088c6]' },
  investing: { title: 'Investice', icon: TrendingUp, gradient: 'from-[#162459] to-[#243471]' },
  property: { title: 'Pojištění majetku', icon: Building2, gradient: 'from-[#009EE2] to-[#0088c6]' },
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
  ok: { label: 'V pořádku', icon: CheckCircle2, color: 'text-[#15803d]', bg: 'bg-[#16a34a]/10' },
  recommendation: { label: 'Doporučení', icon: Target, color: 'text-[#0088c6]', bg: 'bg-[#009EE2]/10' },
  action: { label: 'Vyžaduje akci', icon: AlertCircle, color: 'text-[#b45309]', bg: 'bg-[#f59e0b]/12' },
}

function VariantCard({ variant, index }: { variant: Variant; index: number }) {
  const [open, setOpen] = useState(false)
  const gradient = companyColors[variant.company] || 'from-[#162459] to-[#243471]'
  return (
    <div
      className={`rounded-2xl overflow-hidden transition-all border ${
        open
          ? 'border-[#009EE2] bg-[#009EE2]/5 shadow-[inset_0_0_0_1px_#009EE2]'
          : 'border-[#E8E9EE] bg-white hover:border-[#009EE2]/40 hover:shadow-sm'
      }`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-4 p-4 text-left transition-colors"
      >
        <div
          className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-sm`}
        >
          {variant.logo}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-[#162459] text-[15px]">{variant.company}</h4>
          <p className="text-[11px] tracking-[0.15em] uppercase text-[#818EAF] mt-0.5">
            Varianta {index + 1}
          </p>
        </div>
        <div className="text-right flex-shrink-0 mr-2">
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
              <Separator className="mb-3 bg-[#E8E9EE]" />
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function FinancniPlanPage() {
  const { id } = useParams<{ id: string }>()
  const supabase = useMemo(() => createClient(), [])
  const [planSections, setPlanSections] = useState<PlanSection[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      // Load variants with their params
      const { data: variants } = await (supabase.from('plan_variants') as any)
        .select('*')
        .eq('client_id', id)
        .order('sort_order')

      const { data: params } = await (supabase.from('plan_params') as any)
        .select('*')
        .order('sort_order')

      const { data: recommendations } = await (supabase.from('plan_recommendations') as any)
        .select('*')
        .eq('client_id', id)

      const sections: PlanSection[] = []
      const sectionOrder = ['income', 'housing', 'retirement', 'children', 'investing', 'property']

      for (const sectionId of sectionOrder) {
        const config = sectionConfig[sectionId]
        if (!config) continue

        const sectionVariants = (variants || []).filter((v: { section: string }) => v.section === sectionId)
        const rec = (recommendations || []).find((r: { section: string }) => r.section === sectionId)

        if (sectionVariants.length > 0) {
          const mappedVariants: Variant[] = sectionVariants.map((v: { id: string; company: string; logo: string; monthly_payment: string }) => {
            const variantParams = (params || []).filter((p: { variant_id: string }) => p.variant_id === v.id)
            const paramMap: Record<string, ParamDetail> = {}
            for (const p of variantParams as Array<{ param_label: string; value: string; note?: string }>) {
              paramMap[p.param_label] = { value: p.value, note: p.note || '' }
            }
            return { company: v.company, logo: v.logo || v.company[0], monthlyPayment: v.monthly_payment, params: paramMap }
          })
          sections.push({ id: sectionId, ...config, type: 'variants', variants: mappedVariants, status: rec?.status || 'recommendation' })
        } else if (rec) {
          sections.push({ id: sectionId, ...config, type: 'simple', items: rec.items || [], status: rec.status })
        }
      }

      setPlanSections(sections)
      setLoading(false)
    }
    load()
  }, [supabase, id])

  const hasPlan = planSections.length > 0

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16 xl:px-20 py-10 md:py-14">
      <div className="mb-10">
        <Link
          href={`/klient/${id}`}
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
          Váš osobní plán od certifikovaného poradce. Porovnejte varianty a vyberte tu, která vám sedí.
        </p>
      </div>

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
        <div className="bg-white rounded-3xl border border-[#E8E9EE] p-12 md:p-16 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#009EE2]/10 border border-[#009EE2]/25 mb-5">
            <FileText className="w-8 h-8 text-[#0088c6]" strokeWidth={1.5} />
          </div>
          <h2 className="font-display text-[#162459] mb-2" style={{ fontSize: '1.4rem', letterSpacing: '-0.01em' }}>
            Plán zatím <span style={{ fontStyle: 'italic', color: '#009EE2' }}>není</span>
          </h2>
          <p className="text-[#818EAF] mb-7 max-w-md mx-auto leading-relaxed">
            Nejdříve vyplňte finanční analýzu. Poradce připraví osobní plán do 48 hodin.
          </p>
          <Link
            href={`/klient/${id}/analyza`}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-white text-[15px] transition-all hover:shadow-lg hover:shadow-[#009EE2]/25 hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg, #009EE2, #0088c6)' }}
          >
            Vyplnit analýzu
          </Link>
        </div>
      ) : (
        <>
          <div
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
                <p className="text-xs tracking-[0.3em] uppercase text-[#009EE2]/70 mb-2">Plán · porovnání variant</p>
                <h2
                  className="font-display text-white"
                  style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', letterSpacing: '-0.02em', lineHeight: 1.1 }}
                >
                  Komplexní <span style={{ fontStyle: 'italic', color: '#009EE2' }}>plán</span>
                </h2>
                <p className="text-white/55 text-sm mt-2">
                  {planSections.length} oblastí · Porovnejte varianty a vyberte tu nejlepší
                </p>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-[#162459] bg-white hover:bg-white/90 transition-all"
              >
                <Download className="w-4 h-4" /> Stáhnout PDF
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {planSections.map((section) => {
              const status = statusConfig[section.status]
              return (
                <div
                  key={section.id}
                  className="bg-white rounded-3xl border border-[#E8E9EE] p-5 md:p-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${section.gradient} flex items-center justify-center shadow-sm`}>
                      <section.icon className="w-5 h-5 text-white" strokeWidth={1.8} />
                    </div>
                    <h3 className="font-display text-[#162459] flex-1" style={{ fontSize: '1.1rem', letterSpacing: '-0.01em' }}>
                      {section.title}
                    </h3>
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${status.bg}`}>
                      <status.icon className={`w-3.5 h-3.5 ${status.color}`} />
                      <span className={`text-xs font-medium ${status.color}`}>{status.label}</span>
                    </div>
                  </div>
                  <div className="h-px bg-[#E8E9EE] mb-4" />
                  {section.type === 'variants' && section.variants ? (
                    <div className="space-y-3">
                      <p className="text-sm text-[#818EAF] mb-3">
                        Porovnejte {section.variants.length} variant{section.variants.length === 1 ? 'u' : 'y'} a rozkliknutím zobrazte detail:
                      </p>
                      {section.variants.map((variant, i) => (
                        <VariantCard key={variant.company} variant={variant} index={i} />
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
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
