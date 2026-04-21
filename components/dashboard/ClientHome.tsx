'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import gsap from 'gsap'
import { ClipboardCheck, Package, FileText, MessageCircle, ArrowUpRight } from 'lucide-react'

type Tile = {
  title: string
  desc: string
  href: string
  icon: typeof ClipboardCheck
  variant: 'navy' | 'cyan' | 'light-navy' | 'light-cyan'
}

const TILES: Tile[] = [
  {
    title: 'Analýza',
    desc: 'Vyplňte dotazník a my připravíme finanční plán přesně pro vás.',
    href: '/dashboard/analyza',
    icon: ClipboardCheck,
    variant: 'navy',
  },
  {
    title: 'Finanční plán',
    desc: 'Váš osobní finanční plán od certifikovaného poradce.',
    href: '/dashboard/financni-plan',
    icon: FileText,
    variant: 'cyan',
  },
  {
    title: 'Moje produkty',
    desc: 'Přehled vašich smluv, produktů a platebních údajů.',
    href: '/dashboard/produkty',
    icon: Package,
    variant: 'light-navy',
  },
  {
    title: 'Chat',
    desc: 'Přímá komunikace s vaším finančním poradcem.',
    href: '/dashboard/chat',
    icon: MessageCircle,
    variant: 'light-cyan',
  },
]

function tileStyles(variant: Tile['variant']) {
  switch (variant) {
    case 'navy':
      return {
        card: 'text-white',
        cardStyle: {
          background: 'linear-gradient(160deg, #162459 0%, #243471 60%, #1a2e6b 100%)',
        },
        eyebrow: 'text-[#009EE2]',
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
        cardStyle: {
          background: 'linear-gradient(135deg, #009EE2 0%, #0088c6 100%)',
        },
        eyebrow: 'text-white/70',
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
        eyebrow: 'text-[#818EAF]',
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
        cardStyle: {
          background: '#f8f9fc',
          borderColor: 'rgba(0,158,226,0.20)',
          borderWidth: 1,
        },
        eyebrow: 'text-[#0088c6]',
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

export default function ClientHome({ firstName }: { firstName: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
      tl.from('.dash-eyebrow', { y: 20, opacity: 0, duration: 0.5 })
        .from('.dash-numeral', { y: 30, opacity: 0, duration: 0.6 }, '-=0.35')
        .from('.dash-title', { y: 32, opacity: 0, duration: 0.7 }, '-=0.45')
        .from('.dash-sub', { y: 24, opacity: 0, duration: 0.6 }, '-=0.5')
        .from('.dash-tile', {
          y: 40,
          opacity: 0,
          duration: 0.7,
          stagger: 0.09,
        }, '-=0.35')
    }, el)
    return () => ctx.revert()
  }, [])

  return (
    <div ref={ref} className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16 xl:px-20 py-10 md:py-14">
      {/* Header */}
      <div className="mb-10 md:mb-14">
        <p className="dash-eyebrow text-xs tracking-[0.3em] uppercase text-[#818EAF] mb-3">
          Váš prostor · vítejte zpět
        </p>
        <div className="dash-numeral section-numeral text-[3.5rem] md:text-[5rem] mb-2">01</div>
        <h1
          className="dash-title font-display text-[#162459]"
          style={{
            fontSize: 'clamp(2.25rem, 5vw, 4rem)',
            letterSpacing: '-0.03em',
            lineHeight: 1.02,
          }}
        >
          Dobrý den, <span style={{ fontStyle: 'italic', color: '#009EE2' }}>{firstName}</span>.
          <br />
          <span style={{ color: '#818EAF' }}>Co zvládneme dneska?</span>
        </h1>
        <p className="dash-sub text-[#818EAF] max-w-xl mt-5 leading-relaxed">
          Váš finanční poradce na dosah ruky. Vyplňte analýzu, prohlédněte si produkty nebo napište
          přímo poradci přes chat.
        </p>
      </div>

      {/* Tiles — 4 varianty (navy / cyan / light-navy / light-cyan) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {TILES.map((tile, i) => {
          const s = tileStyles(tile.variant)
          const Icon = tile.icon
          const num = String(i + 1).padStart(2, '0')
          return (
            <Link
              key={tile.title}
              href={tile.href}
              className={`dash-tile group relative overflow-hidden rounded-3xl p-7 md:p-8 min-h-[200px] transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-[#162459]/10 ${s.card}`}
              style={{ border: '1px solid transparent', ...(s.cardStyle as React.CSSProperties) }}
            >
              {/* Decorative numeral in corner */}
              <span
                className={`absolute -top-2 right-3 font-display italic leading-none select-none ${s.numeral}`}
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
                  style={{
                    fontSize: 'clamp(1.35rem, 2.2vw, 1.75rem)',
                    letterSpacing: '-0.01em',
                    lineHeight: 1.15,
                  }}
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
          )
        })}
      </div>
    </div>
  )
}
