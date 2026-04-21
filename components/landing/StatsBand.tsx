'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

type Stat = {
  prefix?: string
  value: number
  suffix?: string
  label: string
  note?: string
}

const STATS: Stat[] = [
  { value: 69000, suffix: '+', label: 'spokojených klientů', note: 'napříč celou ČR' },
  { prefix: 'od ', value: 2003, label: 'na českém trhu', note: 'přes 20 let zkušeností' },
  { value: 500, suffix: '+', label: 'certifikovaných poradců', note: 'v síti ProfiFP / OVB' },
]

export default function StatsBand() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = ref.current
    if (!root) return
    const numbers = root.querySelectorAll<HTMLElement>('[data-count]')
    if (!numbers.length) return

    const ctx = gsap.context(() => {
      numbers.forEach((el) => {
        const target = Number(el.dataset.count || 0)
        const obj = { v: 0 }
        gsap.to(obj, {
          v: target,
          duration: 2.1,
          ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 85%', once: true },
          onUpdate: () => {
            el.textContent = Math.round(obj.v).toLocaleString('cs-CZ').replace(/\s/g, ' ')
          },
        })
      })

      gsap.from(root.querySelectorAll('.stat-item'), {
        y: 40,
        opacity: 0,
        duration: 0.9,
        ease: 'power3.out',
        stagger: 0.12,
        scrollTrigger: { trigger: root, start: 'top 80%' },
      })
    }, root)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={ref}
      aria-label="Čísla, která mluví"
      className="relative px-6 md:px-10 lg:px-16 xl:px-20 py-20 md:py-28 bg-white"
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <div>
            <div className="section-numeral text-[3.5rem] md:text-[5rem] mb-2">01</div>
            <p className="text-xs tracking-[0.3em] uppercase text-[#818EAF] mb-2">Čísla · důkaz, ne reklama</p>
            <h2
              className="font-display text-[#162459]"
              style={{ fontSize: 'clamp(2rem, 4vw, 3.25rem)', letterSpacing: '-0.02em', lineHeight: 1.05 }}
            >
              Síť, která už <span style={{ fontStyle: 'italic', color: '#009EE2' }}>22 let</span> poradí těm,
              <br className="hidden md:block" /> kdo chtějí mít svoje peníze v pořádku.
            </h2>
          </div>
          <p className="text-[#818EAF] text-sm md:text-base max-w-sm leading-relaxed">
            Jsme partnerem ProfiFP a OVB Allfinanz — dvou největších hráčů českého finančního poradenství.
            To se počítá.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#E8E9EE] rounded-2xl overflow-hidden border border-[#E8E9EE]">
          {STATS.map((s, i) => (
            <div
              key={s.label}
              className="stat-item relative bg-white p-8 md:p-10 flex flex-col gap-3"
            >
              <span className="absolute top-4 right-5 text-xs text-[#818EAF] font-mono tracking-wider">
                /0{i + 1}
              </span>
              <div
                className="font-display text-[#162459] flex items-baseline gap-1"
                style={{ fontSize: 'clamp(3rem, 6vw, 5rem)', lineHeight: 1, letterSpacing: '-0.04em', fontWeight: 500 }}
              >
                {s.prefix && <span className="text-[#818EAF] text-[0.45em] font-sans font-medium mr-1">{s.prefix}</span>}
                <span data-count={s.value}>0</span>
                {s.suffix && <span style={{ color: '#009EE2' }}>{s.suffix}</span>}
              </div>
              <div className="h-px w-10 bg-[#009EE2]" />
              <div>
                <div className="text-[#162459] font-medium">{s.label}</div>
                {s.note && <div className="text-sm text-[#818EAF] mt-1">{s.note}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
