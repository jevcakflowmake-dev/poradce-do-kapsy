'use client'

import { useState } from 'react'
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

interface Variant {
  company: string
  logo: string
  monthlyPayment: string
  params: Record<string, string>
}

const paramLabels: Record<string, string> = {
  dailyInjury: 'Denní odškodné v případě úrazu',
  sickLeaveDaily: 'Pracovní neschopnost — denní dávka',
  permanentConsequences: 'Trvalé následky úrazu',
  invalidityI: 'Invalidita I. stupně',
  invalidityII: 'Invalidita II. stupně',
  invalidityIII: 'Invalidita III. stupně',
  seriousIllness: 'Závažné nemoci',
  selfSufficiency: 'Soběstačnost',
  death: 'Smrt',
}

const incomeVariants: Variant[] = [
  {
    company: 'Kooperativa', logo: 'K', monthlyPayment: '1 450 Kč',
    params: { dailyInjury: '300 Kč/den', sickLeaveDaily: '500 Kč/den od 15. dne', permanentConsequences: '1 000 000 Kč (progrese 5x)', invalidityI: '300 000 Kč', invalidityII: '500 000 Kč', invalidityIII: '1 000 000 Kč', seriousIllness: '500 000 Kč', selfSufficiency: '500 000 Kč', death: '1 500 000 Kč' },
  },
  {
    company: 'ČPP', logo: 'Č', monthlyPayment: '1 280 Kč',
    params: { dailyInjury: '250 Kč/den', sickLeaveDaily: '400 Kč/den od 29. dne', permanentConsequences: '800 000 Kč (progrese 4x)', invalidityI: '200 000 Kč', invalidityII: '400 000 Kč', invalidityIII: '800 000 Kč', seriousIllness: '400 000 Kč', selfSufficiency: '300 000 Kč', death: '1 200 000 Kč' },
  },
  {
    company: 'MetLife', logo: 'M', monthlyPayment: '1 650 Kč',
    params: { dailyInjury: '400 Kč/den', sickLeaveDaily: '600 Kč/den od 15. dne', permanentConsequences: '1 200 000 Kč (progrese 6x)', invalidityI: '400 000 Kč', invalidityII: '700 000 Kč', invalidityIII: '1 500 000 Kč', seriousIllness: '700 000 Kč', selfSufficiency: '600 000 Kč', death: '2 000 000 Kč' },
  },
]

const companyColors: Record<string, string> = {
  Kooperativa: 'from-green-600 to-green-700',
  'ČPP': 'from-red-600 to-red-700',
  MetLife: 'from-blue-700 to-blue-800',
}

const statusConfig = {
  ok: { label: 'V pořádku', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  recommendation: { label: 'Doporučení', icon: Target, color: 'text-blue-600', bg: 'bg-blue-50' },
  action: { label: 'Vyžaduje akci', icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
}

const planSections = [
  { title: 'Zajištění příjmů', icon: Shield, gradient: 'from-blue-600 to-indigo-700', type: 'variants' as const, variants: incomeVariants, status: 'recommendation' as const },
  { title: 'Bydlení', icon: HomeIcon, gradient: 'from-emerald-600 to-teal-700', type: 'simple' as const, items: ['Pojištění nemovitosti a domácnosti je v pořádku', 'Zvážit refinancování hypotéky — úrok 4,2 % je nad trhem'], status: 'ok' as const },
  { title: 'Příprava na důchod', icon: Clock, gradient: 'from-amber-500 to-orange-600', type: 'simple' as const, items: ['Zvýšit příspěvek na DPS z 500 na 1 700 Kč', 'Vyjednat příspěvek zaměstnavatele', 'Zahájit pravidelnou investici do ETF fondu'], status: 'action' as const },
  { title: 'Děti', icon: Baby, gradient: 'from-pink-500 to-rose-600', type: 'simple' as const, items: ['Založit stavební spoření pro každé dítě', 'Sjednat úrazové pojištění dětí'], status: 'recommendation' as const },
  { title: 'Investice', icon: TrendingUp, gradient: 'from-violet-600 to-purple-700', type: 'simple' as const, items: ['Spořicí účet: nechat 3 měsíce výdajů jako rezervu', 'Přebytek přesunout do vyváženého portfolia'], status: 'action' as const },
  { title: 'Pojištění majetku', icon: Building2, gradient: 'from-cyan-600 to-sky-700', type: 'simple' as const, items: ['Povinné ručení a havarijní pojištění v pořádku', 'Zvážit pojištění odpovědnosti z běžného života'], status: 'ok' as const },
]

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
              <div className="space-y-2.5">
                {Object.entries(variant.params).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between py-1.5">
                    <span className="text-sm text-slate-600">{paramLabels[key] || key}</span>
                    <span className="text-sm font-semibold text-slate-900 bg-slate-50 px-3 py-1 rounded-lg">{value}</span>
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
  const hasPlan = true

  return (
    <div className="w-full container px-4 mx-auto max-w-4xl py-8">
      <div className="mb-8">
        <Link href={`/klient/${id}`} className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900 transition-colors mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" /> Zpět
        </Link>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Finanční plán</h1>
        <p className="text-slate-500">Váš osobní finanční plán připravený certifikovaným poradcem.</p>
      </div>

      {!hasPlan ? (
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
                <p className="text-slate-400 text-sm mb-1">Připraveno dne 10. 4. 2026</p>
                <h2 className="text-xl font-bold text-white">Komplexní finanční plán</h2>
                <p className="text-slate-400 text-sm mt-1">6 oblastí - Porovnejte varianty a vyberte tu nejlepší</p>
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
                <div key={section.title} className="bg-white rounded-2xl border border-slate-200 p-5">
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
                        Porovnejte {section.variants.length} varianty a rozkliknutím zobrazte detail parametrů:
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
