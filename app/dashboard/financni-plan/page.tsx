'use client'

import { motion } from 'framer-motion'
import { ArrowLeft, FileText, Download, Clock, CheckCircle2, AlertCircle, Target, Shield, TrendingUp, Home as HomeIcon, Baby, Building2 } from 'lucide-react'
import Link from 'next/link'

const planSections = [
  {
    title: 'Zajištění příjmů',
    icon: Shield,
    status: 'recommendation' as const,
    gradient: 'from-[#162459] to-[#243471]',
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
    gradient: 'from-[#009EE2] to-[#0088c6]',
    items: [
      'Pojištění nemovitosti a domácnosti je v pořádku',
      'Zvážit refinancování hypotéky — úrok 4,2 % je nad trhem',
    ],
  },
  {
    title: 'Příprava na důchod',
    icon: Clock,
    status: 'action' as const,
    gradient: 'from-[#162459] to-[#009EE2]',
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
    gradient: 'from-[#009EE2] to-[#0088c6]',
    items: [
      'Založit stavební spoření pro každé dítě',
      'Sjednat úrazové pojištění dětí',
    ],
  },
  {
    title: 'Investice',
    icon: TrendingUp,
    status: 'action' as const,
    gradient: 'from-[#162459] to-[#243471]',
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
    gradient: 'from-[#009EE2] to-[#0088c6]',
    items: [
      'Povinné ručení a havarijní pojištění v pořádku',
      'Zvážit pojištění odpovědnosti z běžného života',
    ],
  },
]

const statusConfig = {
  ok: {
    label: 'V pořádku',
    icon: CheckCircle2,
    color: '#15803d',
    bg: 'rgba(22,163,74,0.10)',
    border: 'rgba(22,163,74,0.30)',
  },
  recommendation: {
    label: 'Doporučení',
    icon: Target,
    color: '#0088c6',
    bg: 'rgba(0,158,226,0.10)',
    border: 'rgba(0,158,226,0.30)',
  },
  action: {
    label: 'Vyžaduje akci',
    icon: AlertCircle,
    color: '#b45309',
    bg: 'rgba(245,158,11,0.12)',
    border: 'rgba(245,158,11,0.35)',
  },
}

export default function FinancniPlanPage() {
  const hasPlan = true

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
          Váš osobní plán od certifikovaného poradce. 6 oblastí, 15 doporučení.
        </p>
      </motion.div>

      {!hasPlan ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl border border-[#E8E9EE] p-12 md:p-16 text-center"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#009EE2]/10 border border-[#009EE2]/25 mb-5">
            <FileText className="w-8 h-8 text-[#0088c6]" strokeWidth={1.5} />
          </div>
          <h2
            className="font-display text-[#162459] mb-2"
            style={{ fontSize: '1.4rem', letterSpacing: '-0.01em' }}
          >
            Plán zatím <span style={{ fontStyle: 'italic', color: '#009EE2' }}>není</span>
          </h2>
          <p className="text-[#818EAF] mb-7 max-w-md mx-auto leading-relaxed">
            Nejdříve vyplňte finanční analýzu. Poradce na základě vašich odpovědí připraví osobní plán do 48 hodin.
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
          {/* Summary card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="relative rounded-3xl p-6 md:p-8 mb-10 overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #0e1a3d 0%, #162459 55%, #243471 100%)',
            }}
          >
            <div className="noise-overlay" aria-hidden />
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'radial-gradient(500px circle at 90% 90%, rgba(0,158,226,0.25), transparent 55%)',
              }}
            />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
              <div>
                <p className="text-xs tracking-[0.3em] uppercase text-[#009EE2]/70 mb-2">
                  Plán · 10. 4. 2026
                </p>
                <h2
                  className="font-display text-white"
                  style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', letterSpacing: '-0.02em', lineHeight: 1.1 }}
                >
                  Komplexní <span style={{ fontStyle: 'italic', color: '#009EE2' }}>plán</span>
                </h2>
                <p className="text-white/55 text-sm mt-2">6 oblastí, 15 doporučení</p>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-[#162459] bg-white hover:bg-white/90 transition-all shadow-sm"
              >
                <Download className="w-4 h-4" />
                Stáhnout PDF
              </button>
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
                  transition={{ delay: 0.25 + idx * 0.07, ease: [0.22, 1, 0.36, 1] }}
                  className="bg-white rounded-3xl border border-[#E8E9EE] p-5 md:p-6 hover:shadow-[0_10px_30px_-10px_rgba(22,36,89,0.1)] transition-all"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${section.gradient} flex items-center justify-center shadow-sm`}
                    >
                      <section.icon className="w-5 h-5 text-white" strokeWidth={1.8} />
                    </div>
                    <h3
                      className="font-display text-[#162459] flex-1"
                      style={{ fontSize: '1.1rem', letterSpacing: '-0.01em' }}
                    >
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
                  <ul className="space-y-2.5">
                    {section.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-[14px] text-[#162459]/85 leading-relaxed">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#009EE2] mt-2 flex-shrink-0" />
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
