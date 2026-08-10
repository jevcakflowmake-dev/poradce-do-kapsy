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

// Čísla patří síti ProfiFP / OVB, ne Jakubovi osobně. Prezentovat je jako
// vlastní by bylo zavádějící (a podle zákona o ochraně spotřebitele riskantní);
// přiznaná atribuce navíc působí důvěryhodněji než nafouknuté číslo.
const STATS: Stat[] = [
  { value: 69000, suffix: '+', label: 'klientů sítě', note: 'ProfiFP a OVB Allfinanz v ČR' },
  { prefix: 'od ', value: 2003, label: 'na českém trhu', note: 'síť, přes kterou sjednávám smlouvy' },
  { value: 500, suffix: '+', label: 'poradců v síti', note: 'jedním z nich jsem já' },
]

/**
 * Čísla jako v tiráži výroční zprávy — žádné karty, jen typografie,
 * svislé hairlines mezi sloupci a counter-up při vjezdu do viewportu.
 */
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
      className="relative px-6 md:px-10 lg:px-16 xl:px-20 py-20 md:py-28 bg-[#F6F4EE] overflow-hidden"
    >
      <div className="noise-paper" aria-hidden />
      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <div>
            <div className="section-numeral text-[3.5rem] md:text-[5rem] mb-3">01</div>
            <p className="text-xs tracking-[0.3em] uppercase text-[#66708C] mb-2">Čísla · důkaz, ne reklama</p>
            <h2
              className="font-display text-[#162459]"
              style={{ fontSize: 'clamp(2rem, 4vw, 3.25rem)', letterSpacing: '-0.02em', lineHeight: 1.05 }}
            >
              Jednáte se mnou.
              <br className="hidden md:block" /> Za mnou stojí{' '}
              <span style={{ fontStyle: 'italic', color: '#009EE2' }}>celá síť.</span>
            </h2>
          </div>
          <p className="text-[#66708C] text-sm md:text-base max-w-sm leading-relaxed">
            Aby bylo jasno: čísla níž patří síti ProfiFP a OVB Allfinanz, ne mně
            osobně. Znamenají ale, že vám nesjednávám smlouvy z jedné pojišťovny —
            mám přístup k nabídkám desítek partnerů a můžu je porovnat.
          </p>
        </div>

        {/* Tiráž — sloupce oddělené hairline, žádné boxy */}
        <div className="grid grid-cols-1 md:grid-cols-3 border-t border-[#E4DFD2] md:divide-x md:divide-[#E4DFD2]">
          {STATS.map((s, i) => (
            <div
              key={s.label}
              className={`stat-item relative py-8 md:py-10 flex flex-col gap-3 border-b border-[#E4DFD2] md:border-b-0 ${
                i > 0 ? 'md:pl-10' : ''
              } ${i < STATS.length - 1 ? 'md:pr-10' : ''}`}
            >
              <span className="absolute top-6 right-0 text-[11px] text-[#66708C]/70 font-mono tracking-wider">
                /0{i + 1}
              </span>
              <div
                className="font-display text-[#162459] flex items-baseline gap-1"
                style={{ fontSize: 'clamp(3rem, 6vw, 5rem)', lineHeight: 1, letterSpacing: '-0.04em' }}
              >
                {s.prefix && <span className="text-[#66708C] text-[0.45em] font-sans font-medium mr-1">{s.prefix}</span>}
                <span data-count={s.value}>0</span>
                {s.suffix && <span style={{ color: '#009EE2' }}>{s.suffix}</span>}
              </div>
              <div className="rule-accent" />
              <div>
                <div className="text-[#162459] font-medium">{s.label}</div>
                {s.note && <div className="text-sm text-[#66708C] mt-1">{s.note}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
