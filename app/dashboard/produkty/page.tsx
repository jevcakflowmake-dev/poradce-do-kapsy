'use client'

import { motion } from 'framer-motion'
import { ArrowLeft, Shield, Clock, TrendingUp, CreditCard, Calendar, FileText, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { Separator } from '@/components/ui/separator'
import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Product {
  id: string
  type: 'insurance' | 'pension' | 'invest'
  title: string
  content: string | null
  file_url: string | null
  link_url: string | null
  created_at: string
}

const typeConfig = {
  insurance: { label: 'Pojištění', icon: Shield, gradient: 'from-blue-600 to-indigo-700', bgLight: 'bg-blue-50', textColor: 'text-blue-700' },
  pension: { label: 'Penzijní produkty', icon: Clock, gradient: 'from-amber-500 to-orange-600', bgLight: 'bg-amber-50', textColor: 'text-amber-700' },
  invest: { label: 'Investice', icon: TrendingUp, gradient: 'from-emerald-600 to-teal-700', bgLight: 'bg-emerald-50', textColor: 'text-emerald-700' },
}

const SECTION_LABELS: Record<string, string> = {
  daily_compensation: 'Denní odškodné',
  hospitalization: 'Hospitalizace',
  disability: 'Invalidita',
  permanent_consequences: 'Trvalé následky',
  serious_illness: 'Závažná onemocnění',
  work_incapacity: 'Pracovní neschopnost',
  death: 'Smrt',
  death_accident: 'Smrt úrazem',
  long_term_care: 'Dlouhodobá péče',
}

function InsuranceDetail({ content }: { content: string | null }) {
  if (!content) return null

  try {
    const parsed = JSON.parse(content)
    if (!parsed.sections) {
      return <p className="text-sm text-slate-500 mt-2">{content}</p>
    }

    return (
      <div className="mt-3 pt-3 border-t border-slate-100">
        <div className="flex items-center gap-2 mb-2">
          {parsed.logo && <span className="text-lg">{parsed.logo}</span>}
          {parsed.company && <span className="text-sm font-medium" style={{ color: '#162459' }}>{parsed.company}</span>}
          {parsed.monthly_price && (
            <span className="ml-auto text-sm font-bold" style={{ color: '#009EE2' }}>
              {parsed.monthly_price} Kč/měsíc
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {(parsed.sections as Array<{ id: string; amount: number }>).map((s) => (
            <div key={s.id} className="flex items-center gap-2 text-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[#009EE2] shrink-0" />
              <span className="text-slate-600">{SECTION_LABELS[s.id] || s.id}</span>
              <span className="font-medium text-slate-900 ml-auto">{s.amount?.toLocaleString('cs-CZ')} Kč</span>
            </div>
          ))}
        </div>
        {parsed.description && (
          <p className="text-sm text-slate-500 mt-2">{parsed.description}</p>
        )}
      </div>
    )
  } catch {
    return <p className="text-sm text-slate-500 mt-2">{content}</p>
  }
}

const mockPayments = [
  { product: 'Životní pojištění Premium', amount: '1 250 Kč', frequency: 'měsíčně', nextDate: '15. 5. 2026', account: 'CZ65 0800 0000 0019 2000 0010', vs: '1234567890' },
  { product: 'Doplňkové penzijní spoření', amount: '1 500 Kč', frequency: 'měsíčně', nextDate: '1. 5. 2026', account: 'CZ77 0300 0000 0000 1234 5678', vs: '9876543210' },
  { product: 'Investiční fond — Dynamický', amount: '3 000 Kč', frequency: 'měsíčně', nextDate: '10. 5. 2026', account: 'CZ55 0100 0000 0000 0055 1234', vs: '5551234000' },
]

export default function ProduktyPage() {
  const [products, setProducts] = useState<Product[]>([])
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('proposals')
        .select('*')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false })
      if (data) setProducts(data as Product[])
    }
    load()
  }, [supabase])

  const grouped = {
    insurance: products.filter(p => p.type === 'insurance'),
    pension: products.filter(p => p.type === 'pension'),
    invest: products.filter(p => p.type === 'invest'),
  }

  return (
    <div className="w-full container px-4 mx-auto max-w-4xl py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <Link href="/dashboard" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900 transition-colors mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" /> Zpět
        </Link>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Moje produkty</h1>
        <p className="text-slate-500">Přehled vašich finančních produktů a platebních informací.</p>
      </motion.div>

      {(Object.keys(typeConfig) as Array<keyof typeof typeConfig>).map((type, idx) => {
        const config = typeConfig[type]
        const items = grouped[type]
        return (
          <motion.div key={type} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${config.gradient} flex items-center justify-center`}>
                <config.icon className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900">{config.label}</h2>
              <span className={`text-xs px-2 py-0.5 rounded-full ${config.bgLight} ${config.textColor} font-medium`}>
                {items.length}
              </span>
            </div>
            {items.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
                <p className="text-sm text-slate-400">Zatím žádné produkty</p>
              </div>
            ) : (
              <div className="space-y-2">
                {items.map(product => (
                  <div key={product.id} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow">
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-slate-900">{product.title}</h3>
                          <span className="text-xs text-slate-400 mt-1 block">{new Date(product.created_at).toLocaleDateString('cs-CZ')}</span>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          {product.file_url && (
                            <a href={product.file_url} target="_blank" rel="noreferrer" className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center hover:bg-slate-200">
                              <FileText className="w-4 h-4 text-slate-600" />
                            </a>
                          )}
                          {product.link_url && (
                            <a href={product.link_url} target="_blank" rel="noreferrer" className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center hover:bg-slate-200">
                              <ExternalLink className="w-4 h-4 text-slate-600" />
                            </a>
                          )}
                        </div>
                      </div>
                      <InsuranceDetail content={product.content} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )
      })}

      <Separator className="my-8" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
            <CreditCard className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">Platební informace</h2>
        </div>
        <div className="space-y-3">
          {mockPayments.map((payment, idx) => (
            <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + idx * 0.1 }} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-slate-900">{payment.product}</h3>
                <span className="text-lg font-bold text-slate-900">{payment.amount}</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <span className="text-slate-400 block text-xs">Frekvence</span>
                  <span className="text-slate-700 font-medium">{payment.frequency}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-xs">Další platba</span>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span className="text-slate-700 font-medium">{payment.nextDate}</span>
                  </div>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block text-xs">Číslo účtu</span>
                  <span className="text-slate-700 font-mono text-xs">{payment.account}</span>
                </div>
              </div>
              <div className="mt-2">
                <span className="text-slate-400 text-xs">VS: </span>
                <span className="text-slate-600 font-mono text-xs">{payment.vs}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
