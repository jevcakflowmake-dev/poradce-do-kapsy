'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ClipboardCheck, Package, FileText, MessageCircle, ArrowUpRight } from 'lucide-react'
import { useParams } from 'next/navigation'

type Tile = {
  title: string
  desc: string
  path: string
  icon: typeof ClipboardCheck
  variant: 'navy' | 'cyan' | 'light-navy' | 'light-cyan'
}

const TILES: Tile[] = [
  { title: 'Analýza', desc: 'Vyplňte dotazník a my připravíme finanční plán přesně pro vás.', path: 'analyza', icon: ClipboardCheck, variant: 'navy' },
  { title: 'Finanční plán', desc: 'Váš osobní finanční plán od certifikovaného poradce.', path: 'financni-plan', icon: FileText, variant: 'cyan' },
  { title: 'Moje produkty', desc: 'Přehled vašich smluv, produktů a platebních údajů.', path: 'produkty', icon: Package, variant: 'light-navy' },
  { title: 'Chat', desc: 'Přímá komunikace s vaším finančním poradcem.', path: 'chat', icon: MessageCircle, variant: 'light-cyan' },
]

function tileStyles(variant: Tile['variant']) {
  switch (variant) {
    case 'navy':
      return {
        card: 'text-white',
        cardStyle: { background: 'linear-gradient(160deg, #162459 0%, #243471 60%, #1a2e6b 100%)' },
        title: 'text-white',
        desc: 'text-white/60',
        icon: 'bg-[#009EE2]',
        iconColor: 'text-white',
        arrowBg: 'bg-white/10 group-hover:bg-[#009EE2]',
        arrow: 'text-white',
        numeral: 'text-white/10',
      }
    case 'cyan':
      return {
        card: 'text-white',
        cardStyle: { background: 'linear-gradient(135deg, #009EE2 0%, #0088c6 100%)' },
        title: 'text-white',
        desc: 'text-white/80',
        icon: 'bg-white/15 backdrop-blur-sm',
        iconColor: 'text-white',
        arrowBg: 'bg-white/15 group-hover:bg-white group-hover:text-[#0088c6]',
        arrow: 'text-white',
        numeral: 'text-white/15',
      }
    case 'light-navy':
      return {
        card: 'text-[#162459] bg-white',
        cardStyle: { borderColor: '#E8E9EE', borderWidth: 1 },
        title: 'text-[#162459]',
        desc: 'text-[#818EAF]',
        icon: 'bg-[#162459]',
        iconColor: 'text-white',
        arrowBg: 'bg-[#f8f9fc] group-hover:bg-[#162459] group-hover:text-white',
        arrow: 'text-[#162459]',
        numeral: 'text-[#009EE2]/15',
      }
    case 'light-cyan':
      return {
        card: 'text-[#162459]',
        cardStyle: { background: '#f0f7fb', borderColor: 'rgba(0,158,226,0.22)', borderWidth: 1 },
        title: 'text-[#162459]',
        desc: 'text-[#162459]/70',
        icon: 'bg-[#009EE2]',
        iconColor: 'text-white',
        arrowBg: 'bg-white group-hover:bg-[#009EE2] group-hover:text-white',
        arrow: 'text-[#009EE2]',
        numeral: 'text-[#009EE2]/15',
      }
  }
}

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
})

export default function KlientPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16 xl:px-20 py-10 md:py-14">
      <div className="mb-10 md:mb-14">
        <motion.p {...fadeUp(0)} className="text-xs tracking-[0.3em] uppercase text-[#818EAF] mb-3">
          Váš prostor · vítejte zpět
        </motion.p>
        <motion.div {...fadeUp(0.08)} className="section-numeral text-[3.5rem] md:text-[5rem] mb-2">
          01
        </motion.div>
        <motion.h1
          {...fadeUp(0.16)}
          className="font-display text-[#162459]"
          style={{ fontSize: 'clamp(2.25rem, 5vw, 4rem)', letterSpacing: '-0.03em', lineHeight: 1.02 }}
        >
          Vítejte v{' '}
          <span style={{ fontStyle: 'italic', color: '#009EE2' }}>portálu</span>.
          <br />
          <span style={{ color: '#818EAF' }}>Co zvládneme dneska?</span>
        </motion.h1>
        <motion.p {...fadeUp(0.3)} className="text-[#818EAF] max-w-xl mt-5 leading-relaxed">
          Váš finanční poradce na dosah ruky. Vyplňte analýzu, prohlédněte si produkty nebo napište
          přímo poradci přes chat.
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {TILES.map((tile, i) => {
          const s = tileStyles(tile.variant)
          const Icon = tile.icon
          const num = String(i + 1).padStart(2, '0')
          return (
            <motion.div key={tile.title} {...fadeUp(0.42 + i * 0.09)}>
              <Link
                href={`/klient/${id}/${tile.path}`}
                className={`group relative overflow-hidden rounded-3xl p-7 md:p-8 min-h-[200px] block transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-[#162459]/10 ${s.card}`}
                style={{ border: '1px solid transparent', ...(s.cardStyle as React.CSSProperties) }}
              >
                <span
                  className={`absolute -top-2 right-3 font-display italic leading-none select-none pointer-events-none ${s.numeral}`}
                  style={{ fontSize: 'clamp(6rem, 12vw, 9rem)', letterSpacing: '-0.04em' }}
                >
                  {num}
                </span>

                <div className="relative z-10 flex flex-col h-full">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-5 ${s.icon}`}>
                    <Icon className={`w-6 h-6 ${s.iconColor}`} strokeWidth={1.8} />
                  </div>

                  <h2
                    className={`font-display mb-2 ${s.title}`}
                    style={{ fontSize: 'clamp(1.35rem, 2.2vw, 1.75rem)', letterSpacing: '-0.01em', lineHeight: 1.15 }}
                  >
                    {tile.title}
                  </h2>
                  <p className={`text-sm leading-relaxed pr-8 ${s.desc} max-w-[90%]`}>{tile.desc}</p>

                  <div
                    className={`absolute bottom-0 right-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110 ${s.arrowBg}`}
                  >
                    <ArrowUpRight className={`w-5 h-5 ${s.arrow} transition-colors`} />
                  </div>
                </div>
              </Link>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
