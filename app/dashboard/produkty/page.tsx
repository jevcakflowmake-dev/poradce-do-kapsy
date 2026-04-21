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
  insurance: {
    label: 'Pojištění',
    icon: Shield,
    gradient: 'from-[#162459] to-[#243471]',
    numeral: '01',
  },
  pension: {
    label: 'Penzijní produkty',
    icon: Clock,
    gradient: 'from-[#009EE2] to-[#0088c6]',
    numeral: '02',
  },
  invest: {
    label: 'Investice',
    icon: TrendingUp,
    gradient: 'from-[#162459] to-[#009EE2]',
    numeral: '03',
  },
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
      <div className="mt-4 pt-4 border-t border-[#E8E9EE]">
        <div className="flex items-center gap-2 mb-3">
          {parsed.logo && <span className="text-lg">{parsed.logo}</span>}
          {parsed.company && <span className="text-sm font-semibold text-[#162459]">{parsed.company}</span>}
          {parsed.monthly_price && (
            <span className="ml-auto text-sm font-bold text-[#0088c6]">
              {parsed.monthly_price} Kč/měsíc
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {(parsed.sections as Array<{ id: string; amount: number }>).map((s) => (
            <div key={s.id} className="flex items-center gap-2 text-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[#009EE2] shrink-0" />
              <span className="text-[#818EAF]">{SECTION_LABELS[s.id] || s.id}</span>
              <span className="font-medium text-[#162459] ml-auto tabular-nums">
                {s.amount?.toLocaleString('cs-CZ')} Kč
              </span>
            </div>
          ))}
        </div>
        {parsed.description && <p className="text-sm text-[#818EAF] mt-3">{parsed.description}</p>}
      </div>
    )
  } catch {
    return <p className="text-sm text-[#818EAF] mt-2">{content}</p>
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
        <div className="section-numeral text-[3rem] md:text-[4.5rem] mb-2">03</div>
        <p className="text-xs tracking-[0.3em] uppercase text-[#818EAF] mb-2">Portfolio · co už máte</p>
        <h1
          className="font-display text-[#162459]"
          style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.02em', lineHeight: 1.05 }}
        >
          Moje <span style={{ fontStyle: 'italic', color: '#009EE2' }}>produkty</span>
        </h1>
        <p className="text-[#818EAF] mt-3 max-w-xl leading-relaxed">
          Přehled vašich finančních produktů a platebních informací.
        </p>
      </motion.div>

      {(Object.keys(typeConfig) as Array<keyof typeof typeConfig>).map((type, idx) => {
        const config = typeConfig[type]
        const items = grouped[type]
        return (
          <motion.div
            key={type}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-sm`}
              >
                <config.icon className="w-5 h-5 text-white" strokeWidth={1.8} />
              </div>
              <h2
                className="font-display text-[#162459]"
                style={{ fontSize: '1.25rem', letterSpacing: '-0.01em' }}
              >
                {config.label}
              </h2>
              <span className="text-xs px-2.5 py-1 rounded-full bg-[#f8f9fc] text-[#818EAF] border border-[#E8E9EE] font-medium">
                {items.length}
              </span>
            </div>
            {items.length === 0 ? (
              <div className="bg-white rounded-3xl border border-[#E8E9EE] p-8 text-center">
                <p className="text-sm text-[#818EAF]">Zatím žádné produkty</p>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white rounded-3xl border border-[#E8E9EE] p-5 md:p-6 transition-all hover:shadow-[0_10px_30px_-10px_rgba(22,36,89,0.1)] hover:border-[#009EE2]/30"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-display text-[#162459]" style={{ fontSize: '1.05rem', letterSpacing: '-0.01em' }}>
                          {product.title}
                        </h3>
                        <span className="text-xs text-[#818EAF] mt-1 block">
                          {new Date(product.created_at).toLocaleDateString('cs-CZ')}
                        </span>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        {product.file_url && (
                          <a
                            href={product.file_url}
                            target="_blank"
                            rel="noreferrer"
                            className="w-9 h-9 bg-[#f8f9fc] border border-[#E8E9EE] rounded-xl flex items-center justify-center hover:bg-[#162459] hover:text-white hover:border-[#162459] transition-colors group"
                          >
                            <FileText className="w-4 h-4" />
                          </a>
                        )}
                        {product.link_url && (
                          <a
                            href={product.link_url}
                            target="_blank"
                            rel="noreferrer"
                            className="w-9 h-9 bg-[#f8f9fc] border border-[#E8E9EE] rounded-xl flex items-center justify-center hover:bg-[#162459] hover:text-white hover:border-[#162459] transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                    <InsuranceDetail content={product.content} />
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )
      })}

      <Separator className="my-10 bg-[#E8E9EE]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-[#162459] flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-white" strokeWidth={1.8} />
          </div>
          <h2
            className="font-display text-[#162459]"
            style={{ fontSize: '1.25rem', letterSpacing: '-0.01em' }}
          >
            Platební <span style={{ fontStyle: 'italic', color: '#009EE2' }}>informace</span>
          </h2>
        </div>
        <div className="space-y-3">
          {mockPayments.map((payment, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 + idx * 0.08 }}
              className="bg-white rounded-3xl border border-[#E8E9EE] p-5 md:p-6 hover:shadow-[0_10px_30px_-10px_rgba(22,36,89,0.08)] transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <h3
                  className="font-display text-[#162459]"
                  style={{ fontSize: '1rem', letterSpacing: '-0.01em' }}
                >
                  {payment.product}
                </h3>
                <span className="font-display text-[#0088c6] tabular-nums" style={{ fontSize: '1.15rem' }}>
                  {payment.amount}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-[11px] tracking-[0.15em] uppercase text-[#818EAF] block mb-0.5">
                    Frekvence
                  </span>
                  <span className="text-[#162459] font-medium">{payment.frequency}</span>
                </div>
                <div>
                  <span className="text-[11px] tracking-[0.15em] uppercase text-[#818EAF] block mb-0.5">
                    Další platba
                  </span>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#818EAF]" />
                    <span className="text-[#162459] font-medium">{payment.nextDate}</span>
                  </div>
                </div>
                <div className="col-span-2">
                  <span className="text-[11px] tracking-[0.15em] uppercase text-[#818EAF] block mb-0.5">
                    Číslo účtu
                  </span>
                  <span className="text-[#162459] font-mono text-xs">{payment.account}</span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-[#E8E9EE]">
                <span className="text-[11px] tracking-[0.15em] uppercase text-[#818EAF]">VS · </span>
                <span className="text-[#162459] font-mono text-xs">{payment.vs}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
