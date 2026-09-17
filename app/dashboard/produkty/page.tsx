'use client'

import { motion } from 'framer-motion'
import StoredFileLink from '@/components/files/StoredFileLink'
import { Shield, Clock, TrendingUp, FileText, ExternalLink } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import MesicniPlatby from '@/components/products/MesicniPlatby'

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
    plocha: 'bg-navy',
    numeral: '01',
  },
  pension: {
    label: 'Penzijní produkty',
    icon: Clock,
    plocha: 'bg-mint',
    numeral: '02',
  },
  invest: {
    label: 'Investice',
    icon: TrendingUp,
    plocha: 'bg-navy-soft',
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

type InsuranceContent = {
  logo?: string
  company?: string
  monthly_price?: number | string
  sections?: Array<{ id: string; amount: number }>
  description?: string
}

function InsuranceDetail({ content }: { content: string | null }) {
  if (!content) return null

  // V try/catch je jen parsování. React JSX nevyhodnocuje hned při vytvoření,
  // takže chyba při renderu by tímhle catch stejně jen propadla dál.
  let parsed: InsuranceContent | null = null
  try {
    parsed = JSON.parse(content) as InsuranceContent
  } catch {
    parsed = null
  }

  if (!parsed?.sections) {
    return <p className="text-sm text-slate mt-2">{content}</p>
  }

  return (
    <div className="mt-4 pt-4 border-t border-line">
      <div className="flex items-center gap-2 mb-3">
        {parsed.logo && <span className="text-lg">{parsed.logo}</span>}
        {parsed.company && <span className="text-sm font-semibold text-navy">{parsed.company}</span>}
        {parsed.monthly_price && (
          <span className="ml-auto text-sm font-bold text-navy">
            {parsed.monthly_price} Kč/měsíc
          </span>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {parsed.sections.map((s) => (
          <div key={s.id} className="flex items-center gap-2 text-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-mint shrink-0" />
            <span className="text-slate">{SECTION_LABELS[s.id] || s.id}</span>
            <span className="font-medium text-navy ml-auto tabular-nums">
              {s.amount?.toLocaleString('cs-CZ')} Kč
            </span>
          </div>
        ))}
      </div>
      {parsed.description && <p className="text-sm text-slate mt-3">{parsed.description}</p>}
    </div>
  )
}

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
    <div className="max-w-shell mx-auto px-6 md:px-10 lg:px-16 xl:px-20 py-10 md:py-14">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="mb-10"
      >
        <h1 className="font-display text-h2 text-navy">
          Moje smlouvy
        </h1>
        <p className="text-slate mt-3 max-w-xl leading-relaxed">
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
                className={`w-10 h-10 rounded-card ${config.plocha} flex items-center justify-center shadow-sm`}
              >
                <config.icon className="w-5 h-5 text-cream" strokeWidth={1.8} />
              </div>
              <h2
                className="font-display text-navy text-h3"
              >
                {config.label}
              </h2>
              <span className="text-xs px-2.5 py-1 rounded-full bg-cream text-slate border border-line font-medium">
                {items.length}
              </span>
            </div>
            {items.length === 0 ? (
              <div className="bg-surface rounded-card border border-line p-8 text-center">
                <p className="text-sm text-slate">Zatím žádné produkty</p>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((product) => (
                  <div
                    key={product.id}
                    className="bg-surface rounded-card border border-line p-5 md:p-6 transition-all hover:shadow-[0_10px_30px_-10px_rgba(15,42,68,0.1)] hover:border-mint/30"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-display text-navy text-lead">
                          {product.title}
                        </h3>
                        <span className="text-xs text-slate mt-1 block">
                          {new Date(product.created_at).toLocaleDateString('cs-CZ')}
                        </span>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        {product.file_url && (
                          <StoredFileLink
                            bucket="proposals"
                            path={product.file_url}
                            className="w-9 h-9 bg-cream border border-line rounded-card flex items-center justify-center hover:bg-navy hover:text-white hover:border-navy transition-colors group"
                          >
                            <FileText className="w-4 h-4" />
                          </StoredFileLink>
                        )}
                        {product.link_url && (
                          <a
                            href={product.link_url}
                            target="_blank"
                            rel="noreferrer"
                            className="w-9 h-9 bg-cream border border-line rounded-card flex items-center justify-center hover:bg-navy hover:text-white hover:border-navy transition-colors"
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

      <Separator className="my-10 bg-line" />

      <MesicniPlatby navrhy={products} pohled="klient" />
    </div>
  )
}
