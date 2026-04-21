'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

const PRODUCTS = [
  { title: 'Zajištění příjmů', desc: 'Ochrana vašeho příjmu a životní úrovně', icon: '🛡️' },
  { title: 'Příprava na penzi', desc: 'Klidný důchod s příspěvkem od státu', icon: '🏖️' },
  { title: 'Pojištění majetku', desc: 'Ochrana vašeho domova a věcí', icon: '🏠' },
  { title: 'Investování', desc: 'Nechte peníze pracovat za vás', icon: '📈' },
  { title: 'Hypotéka', desc: 'Financování vlastního bydlení', icon: '🔑' },
]

export default function ServicesSection() {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ctx = gsap.context(() => {
      gsap.from('.service-head > *', {
        y: 30,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
        stagger: 0.08,
        scrollTrigger: { trigger: el, start: 'top 82%' },
      })
      gsap.from('.service-card', {
        y: 60,
        opacity: 0,
        duration: 0.9,
        ease: 'power3.out',
        stagger: 0.08,
        scrollTrigger: { trigger: '.services-grid', start: 'top 85%' },
      })
    }, el)
    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={ref}
      id="sluzby"
      className="relative px-6 md:px-10 lg:px-16 xl:px-20 py-24 overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #162459 0%, #243471 60%, #1a2e6b 100%)' }}
    >
      {/* Radial accent mesh + noise — never flat color */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(600px circle at 15% 20%, rgba(0,158,226,0.18), transparent 55%), radial-gradient(800px circle at 90% 85%, rgba(0,158,226,0.12), transparent 60%)',
        }}
      />
      <div className="noise-overlay" aria-hidden />

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="service-head mb-16 max-w-3xl">
          <div className="section-numeral text-[3.5rem] md:text-[5rem] mb-2" style={{ color: '#009EE2', opacity: 0.28 }}>
            04
          </div>
          <p className="text-xs tracking-[0.3em] uppercase text-[#009EE2]/70 mb-3">Oblasti · komplexní poradenství</p>
          <h2
            className="font-display text-white"
            style={{ fontSize: 'clamp(2rem, 4.5vw, 3.5rem)', letterSpacing: '-0.02em', lineHeight: 1.05 }}
          >
            Pět oblastí. <span style={{ fontStyle: 'italic', color: '#009EE2' }}>Jeden</span> poradce.
          </h2>
          <p className="text-white/60 mt-4 leading-relaxed max-w-xl">
            Komplexní finanční poradenství pod jednou střechou — ne pět různých prodejců, ale jedna osoba, která ví, jak všechno souvisí.
          </p>
        </div>

        <div className="services-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          {PRODUCTS.map((p, i) => {
            // 5 items in a 6-col grid — first wide, rest take 2 cols, tidy asymmetry
            const col = i === 0 ? 'lg:col-span-3' : i === 1 ? 'lg:col-span-3' : 'lg:col-span-2'
            return (
              <div
                key={p.title}
                className={`service-card card-hoverable relative group bg-white/[0.04] backdrop-blur-sm rounded-3xl p-8 border border-white/10 hover:bg-white/[0.08] hover:border-[#009EE2]/50 overflow-hidden ${col}`}
              >
                <div className="absolute top-5 right-6 font-mono text-[11px] text-white/30 tracking-wider">
                  S/0{i + 1}
                </div>
                <div className="text-4xl mb-5">{p.icon}</div>
                <h3
                  className="font-display text-white mb-2"
                  style={{ fontSize: 'clamp(1.25rem, 1.8vw, 1.75rem)', letterSpacing: '-0.01em', lineHeight: 1.15 }}
                >
                  {p.title}
                </h3>
                <p className="text-white/55 leading-relaxed">{p.desc}</p>

                <div className="mt-6 h-px bg-white/10 overflow-hidden">
                  <div className="h-full w-0 bg-[#009EE2] group-hover:w-full transition-all duration-[700ms] ease-[cubic-bezier(0.22,1,0.36,1)]" />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
