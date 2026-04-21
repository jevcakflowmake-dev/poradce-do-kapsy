'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

const BENEFITS = [
  { icon: '🏠', title: 'Bez schůzek', desc: 'Celý proces od A do Z online. Žádné cestování, žádné čekání v kanceláři.' },
  { icon: '📋', title: 'Osobní návrh do 48h', desc: 'Certifikovaný poradce připraví návrh přesně pro vaši životní situaci.' },
  { icon: '💬', title: 'Přímý chat s poradcem', desc: 'Kdykoli máte dotaz, napište přímo poradci přes chat. Odpověď do 24 hodin.' },
  { icon: '🔒', title: 'Bezpečné a důvěrné', desc: 'Vaše data jsou chráněna a nikdy neposkytnuty třetím stranám bez vašeho souhlasu.' },
  { icon: '✓', title: 'Bez závazků', desc: 'Návrh si v klidu prostudujete. Rozhodnutí je vždy jen na vás.' },
  { icon: '💰', title: '100% zdarma', desc: 'Poradenství neplatíte. Poradce je odměňován provizí od partnerů.' },
]

export default function BenefitsSection() {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ctx = gsap.context(() => {
      gsap.from('.benefit-card', {
        y: 50,
        opacity: 0,
        duration: 0.85,
        ease: 'power3.out',
        stagger: 0.09,
        scrollTrigger: { trigger: el, start: 'top 80%' },
      })
      gsap.from('.benefits-head > *', {
        y: 30,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
        stagger: 0.08,
        scrollTrigger: { trigger: el, start: 'top 85%' },
      })
    }, el)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={ref} className="relative px-6 md:px-10 lg:px-16 xl:px-20 py-24 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="benefits-head grid md:grid-cols-12 gap-8 mb-16 items-end">
          <div className="md:col-span-5">
            <div className="section-numeral text-[3.5rem] md:text-[5rem] mb-2">03</div>
            <p className="text-xs tracking-[0.3em] uppercase text-[#818EAF] mb-2">Proč my · a ne pobočka banky</p>
          </div>
          <h2
            className="md:col-span-7 font-display text-[#162459]"
            style={{ fontSize: 'clamp(2rem, 4vw, 3.25rem)', letterSpacing: '-0.02em', lineHeight: 1.05 }}
          >
            Moderní přístup. <span style={{ fontStyle: 'italic', color: '#009EE2' }}>Bez</span> obleku,
            <br className="hidden md:block" /> kanceláře a tlaku na podpis.
          </h2>
        </div>

        {/* Asymmetric 12-col bento — 2 rows of 3 cards with one "wide" */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          {BENEFITS.map((b, i) => {
            const wide = i === 1 || i === 4
            return (
              <div
                key={b.title}
                className={`benefit-card card-hoverable group relative overflow-hidden p-7 md:p-8 rounded-3xl border border-[#E8E9EE] bg-white hover:border-[#009EE2]/40 hover:shadow-xl hover:shadow-[#009EE2]/5 ${wide ? 'md:col-span-4' : 'md:col-span-2'}`}
              >
                <div className="absolute top-5 right-6 font-mono text-[11px] text-[#818EAF] tracking-wider">
                  0{i + 1}
                </div>
                <div className="text-3xl mb-5">{b.icon}</div>
                <h3
                  className="font-display text-[#162459] mb-2"
                  style={{ fontSize: 'clamp(1.15rem, 1.6vw, 1.5rem)', letterSpacing: '-0.01em', lineHeight: 1.2 }}
                >
                  {b.title}
                </h3>
                <p className="text-sm md:text-[15px] leading-relaxed text-[#818EAF]">{b.desc}</p>

                {/* Bottom rule that grows on hover */}
                <div className="mt-6 h-px bg-[#E8E9EE] overflow-hidden">
                  <div className="h-full w-0 bg-[#009EE2] group-hover:w-full transition-all duration-[650ms] ease-[cubic-bezier(0.22,1,0.36,1)]" />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
