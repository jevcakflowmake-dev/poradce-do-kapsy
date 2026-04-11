'use client'

import { motion } from 'framer-motion'
import { ArrowUpRight, ClipboardCheck, Package, FileText, MessageCircle } from 'lucide-react'
import Link from 'next/link'

const tiles = [
  {
    title: 'Analýza',
    desc: 'Vyplňte dotazník a my připravíme finanční plán přesně pro vás',
    icon: ClipboardCheck,
    href: '/dashboard/analyza',
    gradient: 'from-blue-600 to-indigo-700',
  },
  {
    title: 'Moje produkty',
    desc: 'Přehled vašich smluv, produktů a platebních údajů',
    icon: Package,
    href: '/dashboard/produkty',
    gradient: 'from-emerald-600 to-teal-700',
  },
  {
    title: 'Finanční plán',
    desc: 'Váš osobní finanční plán od certifikovaného poradce',
    icon: FileText,
    href: '/dashboard/financni-plan',
    gradient: 'from-amber-500 to-orange-600',
  },
  {
    title: 'Chat',
    desc: 'Přímá komunikace s vaším finančním poradcem',
    icon: MessageCircle,
    href: '/dashboard/chat',
    gradient: 'from-violet-600 to-purple-700',
  },
]

export default function DashboardPage() {
  return (
    <div className="w-full container px-4 mx-auto max-w-6xl py-8">
      <motion.div
        className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-8 md:p-12 mb-10 relative overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-600/20 via-transparent to-transparent" />
        <div className="relative z-10">
          <motion.h1
            className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <span className="bg-gradient-to-r from-white via-blue-100 to-blue-200 bg-clip-text text-transparent">
              Vítejte v portálu
            </span>
          </motion.h1>
          <motion.p
            className="text-slate-400 text-base md:text-lg max-w-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Váš finanční poradce na dosah ruky. Vyplňte analýzu, prohlédněte si
            své produkty nebo komunikujte přímo s poradcem.
          </motion.p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {tiles.map((tile, index) => (
          <motion.div
            key={tile.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 * index + 0.4 }}
          >
            <Link href={tile.href} className="block group">
              <div className="relative bg-white rounded-2xl border border-slate-200 p-6 min-h-[200px] overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/50 hover:border-slate-300 hover:-translate-y-1">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${tile.gradient} mb-4 shadow-lg`}>
                  <tile.icon className="w-6 h-6 text-white" />
                </div>

                <h2 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-slate-700 transition-colors">
                  {tile.title}
                </h2>
                <p className="text-sm text-slate-500 leading-relaxed pr-12">
                  {tile.desc}
                </p>

                <div className="absolute bottom-4 right-4 w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center group-hover:bg-gradient-to-br group-hover:from-slate-800 group-hover:to-slate-900 group-hover:text-white group-hover:scale-110 transition-all duration-300 shadow-sm">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
