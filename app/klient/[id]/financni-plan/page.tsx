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
  income: { title: 'Zajištění příjmů', icon: Shield, gradient: 'from-blue-600 to-indigo-700' },
  housing: { title: 'Bydlení', icon: HomeIcon, gradient: 'from-emerald-600 to-teal-700' },
  retirement: { title: 'Příprava na důchod', icon: Clock, gradient: 'from-amber-500 to-orange-600' },
  children: { title: 'Děti', icon: Baby, gradient: 'from-pink-500 to-rose-600' },
  investing: { title: 'Investice', icon: TrendingUp, gradient: 'from-violet-600 to-purple-700' },
  property: { title: 'Pojištění majetku', icon: Building2, gradient: 'from-cyan-600 to-sky-700' },
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
  ok: { label: 'V pořádku', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  recommendation: { label: 'Doporučení', icon: Target, color: 'text-blue-600', bg: 'bg-blue-50' },
  action: { label: 'Vyžaduje akci', icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
}

function VariantCard({ variant, index }: { variant: Variant; index: number }) {
  const [open, setOpen] = useState(false)
  const gradient = companyColors[variant.company] || 'from-slate-600 to-slate-700'
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-4 p-4 text-left hover:bg-slate-50 transition-colors">
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-sm`}>
          {variant.logo}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-slate-900">{variant.company}</h4>
          <p className="text-xs text-slate-400">Varianta {index + 1}</p>
        </div>
        <div className="text-right flex-shrink-0 mr-2">
          <span className="text-lg font-bold text-slate-900">{variant.monthlyPayment}</span>
          <p className="text-xs text-slate-400">/ měsíc</p>
        </div>
        {open ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
            <div className="px-4 pb-4">
              <Separator className="mb-3" />
              <div className="space-y-3">
                {Object.entries(variant.params).map(([key, detail]) => (
                  <div key={key} className="bg-slate-50/70 rounded-lg px-4 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-700">{key}</span>
                      <span className="text-sm font-bold text-slate-900 bg-white px-3 py-0.5 rounded-md shadow-sm">{detail.value}</span>
                    </div>
                    {detail.note && <p className="text-xs text-slate-400 leading-relaxed">{detail.note}</p>}
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
    <div className="w-full container px-4 mx-auto max-w-4xl py-8">
      <div className="mb-8">
        <Link href={`/klient/${id}`} className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900 transition-colors mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" /> Zpět
        </Link>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Finanční plán</h1>
        <p className="text-slate-500">Váš osobní finanční plán připravený certifikovaným poradcem.</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse">
              <div className="h-6 bg-slate-100 rounded w-1/3 mb-3" />
              <div className="h-4 bg-slate-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : !hasPlan ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Plán zatím není k dispozici</h2>
          <p className="text-slate-500 mb-6 max-w-md mx-auto">Nejdříve vyplňte finanční analýzu. Poradce připraví osobní plán do 48 hodin.</p>
          <Link href={`/klient/${id}/analyza`}>
            <Button className="bg-gradient-to-r from-slate-800 to-slate-900 text-white px-6 rounded-xl">Vyplnit analýzu</Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 md:p-8 mb-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">Komplexní finanční plán</h2>
                <p className="text-slate-400 text-sm mt-1">{planSections.length} oblastí - Porovnejte varianty a vyberte tu nejlepší</p>
              </div>
              <Button className="bg-white text-slate-900 hover:bg-slate-100 rounded-xl px-6 gap-2 shadow-lg">
                <Download className="w-4 h-4" /> Stáhnout PDF
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            {planSections.map((section) => {
              const status = statusConfig[section.status]
              return (
                <div key={section.id} className="bg-white rounded-2xl border border-slate-200 p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${section.gradient} flex items-center justify-center shadow-sm`}>
                      <section.icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-slate-900 flex-1">{section.title}</h3>
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${status.bg}`}>
                      <status.icon className={`w-3.5 h-3.5 ${status.color}`} />
                      <span className={`text-xs font-medium ${status.color}`}>{status.label}</span>
                    </div>
                  </div>
                  <Separator className="mb-4" />
                  {section.type === 'variants' && section.variants ? (
                    <div className="space-y-3">
                      <p className="text-sm text-slate-500 mb-3">
                        Porovnejte {section.variants.length} variant{section.variants.length === 1 ? 'u' : 'y'} a rozkliknutím zobrazte detail:
                      </p>
                      {section.variants.map((variant, i) => (
                        <VariantCard key={variant.company} variant={variant} index={i} />
                      ))}
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {section.items?.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 flex-shrink-0" />
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
