'use client'

import { Shield, Clock, TrendingUp } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import MesicniPlatby from '@/components/products/MesicniPlatby'
import SmlouvaPolozka, { type Product } from '@/components/products/SmlouvaPolozka'

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
      <div
        className="mb-10"
      >
        <h1 className="font-display text-h2 text-navy">
          Moje smlouvy
        </h1>
        <p className="text-slate mt-3 max-w-xl leading-relaxed">
          Přehled vašich finančních produktů a platebních informací.
        </p>
      </div>

      {(Object.keys(typeConfig) as Array<keyof typeof typeConfig>).map((type) => {
        const config = typeConfig[type]
        const items = grouped[type]
        return (
          <div
            key={type}
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
                <p className="text-base text-slate">Zatím žádné produkty</p>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((product) => (
                  <SmlouvaPolozka key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        )
      })}

      <Separator className="my-10 bg-line" />

      <MesicniPlatby navrhy={products} pohled="klient" />
    </div>
  )
}
