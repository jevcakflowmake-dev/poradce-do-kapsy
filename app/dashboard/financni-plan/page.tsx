'use client'

import { motion } from 'framer-motion'
import { ArrowLeft, FileText, Download, Clock, CheckCircle2, AlertCircle, Target, Shield, TrendingUp, Home as HomeIcon, Baby, Building2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

const planSections = [
  {
    title: 'Zajištění příjmů',
    icon: Shield,
    status: 'recommendation' as const,
    gradient: 'from-blue-600 to-indigo-700',
    items: [
      'Navýšení životního pojištění na 3 mil. Kč',
      'Přidání pojištění pracovní neschopnosti od 15. dne',
      'Přidání pojištění invalidity 3. stupně',
    ],
  },
  {
    title: 'Bydlení',
    icon: HomeIcon,
    status: 'ok' as const,
    gradient: 'from-emerald-600 to-teal-700',
    items: [
      'Pojištění nemovitosti a domácnosti je v pořádku',
      'Zvážit refinancování hypotéky — úrok 4,2 % je nad trhem',
    ],
  },
  {
    title: 'Příprava na důchod',
    icon: Clock,
    status: 'action' as const,
    gradient: 'from-amber-500 to-orange-600',
    items: [
      'Zvýšit příspěvek na DPS z 500 na 1 700 Kč (max. státní příspěvek)',
      'Vyjednat příspěvek zaměstnavatele',
      'Zahájit pravidelnou investici do ETF fondu',
    ],
  },
  {
    title: 'Děti',
    icon: Baby,
    status: 'recommendation' as const,
    gradient: 'from-pink-500 to-rose-600',
    items: [
      'Založit stavební spoření pro každé dítě',
      'Sjednat úrazové pojištění dětí',
    ],
  },
  {
    title: 'Investice',
    icon: TrendingUp,
    status: 'action' as const,
    gradient: 'from-violet-600 to-purple-700',
    items: [
      'Spořicí účet: nechat 3 měsíce výdajů jako rezervu',
      'Přebytek přesunout do vyváženého portfolia',
      'Investiční horizont 10+ let: doporučen dynamický profil',
    ],
  },
  {
    title: 'Pojištění majetku',
    icon: Building2,
    status: 'ok' as const,
    gradient: 'from-cyan-600 to-sky-700',
    items: [
      'Povinné ručení a havarijní pojištění v pořádku',
      'Zvážit pojištění odpovědnosti z běžného života',
    ],
  },
]

const statusConfig = {
  ok: { label: 'V pořádku', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  recommendation: { label: 'Doporučení', icon: Target, color: 'text-blue-600', bg: 'bg-blue-50' },
  action: { label: 'Vyžaduje akci', icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
}

export default function FinancniPlanPage() {
  const hasPlan = true // later: check from DB

  return (
    <div className="w-full container px-4 mx-auto max-w-4xl py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <Link href="/dashboard" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900 transition-colors mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" /> Zpět
        </Link>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Finanční plán</h1>
        <p className="text-slate-500">Váš osobní finanční plán připravený certifikovaným poradcem.</p>
      </motion.div>

      {!hasPlan ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl border border-slate-200 p-12 text-center"
        >
          <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Plán zatím není k dispozici</h2>
          <p className="text-slate-500 mb-6 max-w-md mx-auto">
            Nejdříve vyplňte finanční analýzu. Poradce na základě vašich odpovědí připraví osobní plán do 48 hodin.
          </p>
          <Link href="/dashboard/analyza">
            <Button className="bg-gradient-to-r from-slate-800 to-slate-900 text-white px-6 rounded-xl">
              Vyplnit analýzu
            </Button>
          </Link>
        </motion.div>
      ) : (
        <>
          {/* Summary card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 md:p-8 mb-8 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-slate-400 text-sm mb-1">Připraveno dne 10. 4. 2026</p>
                <h2 className="text-xl font-bold text-white">Komplexní finanční plán</h2>
                <p className="text-slate-400 text-sm mt-1">6 oblastí, 15 doporučení</p>
              </div>
              <Button className="bg-white text-slate-900 hover:bg-slate-100 rounded-xl px-6 gap-2 shadow-lg">
                <Download className="w-4 h-4" />
                Stáhnout PDF
              </Button>
            </div>
          </motion.div>

          {/* Plan sections */}
          <div className="space-y-4">
            {planSections.map((section, idx) => {
              const status = statusConfig[section.status]
              return (
                <motion.div
                  key={section.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + idx * 0.08 }}
                  className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-shadow"
                >
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
                  <Separator className="mb-3" />
                  <ul className="space-y-2">
                    {section.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
