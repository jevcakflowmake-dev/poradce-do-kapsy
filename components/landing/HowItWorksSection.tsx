'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

const STEPS = [
  {
    num: '01',
    title: 'Vyplňte dotazník',
    desc: 'Komplexní dotazník o vaší finanční situaci. Zabere přibližně 10 minut.',
    detail: 'Věk, příjem, rodinná situace a finanční cíle',
  },
  {
    num: '02',
    title: 'Poradce připraví návrh',
    desc: 'Do 48 hodin obdržíte osobní finanční návrh šitý na míru.',
    detail: 'Pojištění, důchod nebo investice podle vašich potřeb',
  },
  {
    num: '03',
    title: 'Komunikujte přes chat',
    desc: 'Máte otázky? Pište poradci přímo přes chat. Bez čekání na termín.',
    detail: 'Odpověď zpravidla do 24 hodin',
  },
  {
    num: '04',
    title: 'Rozhodněte se',
    desc: 'Vše si v klidu prostudujete a rozhodnete se bez tlaku.',
    detail: 'Žádné závazky, žádný nátlak',
  },
]

/**
 * Editorial číslovaný seznam — řádky jako položky smlouvy.
 * Žádné karty, žádné stíny: velký obrysový numerál, hairline mezi řádky,
 * hover přelije numerál azurem.
 */
export default function HowItWorksSection() {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ctx = gsap.context(() => {
      gsap.from('.hiw-head > *', {
        y: 30,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
        stagger: 0.08,
        scrollTrigger: { trigger: el, start: 'top 82%' },
      })
      gsap.from('.hiw-row', {
        y: 50,
        opacity: 0,
        duration: 0.9,
        ease: 'power3.out',
        stagger: 0.12,
        scrollTrigger: { trigger: '.hiw-rows', start: 'top 85%' },
      })
    }, el)
    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={ref}
      id="jak-to-funguje"
      className="relative px-6 md:px-10 lg:px-16 xl:px-20 py-24 md:py-32 bg-[#F6F4EE] overflow-hidden"
    >
      <div className="noise-paper" aria-hidden />

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="hiw-head grid grid-cols-12 gap-6 items-end mb-16 md:mb-20">
          <div className="col-span-12 md:col-span-7">
            <div className="section-numeral text-[3.5rem] md:text-[5rem] mb-3">03</div>
            <p className="text-xs tracking-[0.3em] uppercase text-[#66708C] mb-3">Proces · jak to funguje</p>
            <h2
              className="font-display text-[#162459]"
              style={{ fontSize: 'clamp(2rem, 4.5vw, 3.5rem)', letterSpacing: '-0.02em', lineHeight: 1.05 }}
            >
              Čtyři kroky —
              <br />
              <span style={{ fontStyle: 'italic', color: '#009EE2' }}>žádné schůzky mezi nimi.</span>
            </h2>
          </div>
          <p className="col-span-12 md:col-span-5 text-[#66708C] text-sm md:text-base max-w-sm md:justify-self-end leading-relaxed">
            Od prvního kliknutí po osobní návrh uběhne maximálně 48 hodin.
            Celé z gauče, vlastním tempem.
          </p>
        </div>

        <div className="hiw-rows border-t border-[#E4DFD2]">
          {STEPS.map((step, i) => (
            <article
              key={step.num}
              className="hiw-row group relative grid grid-cols-12 gap-4 md:gap-6 items-baseline py-8 md:py-10 border-b border-[#E4DFD2]"
            >
              {/* Obrysový numerál — hover ho přelije azurem (viz .numeral-outline) */}
              <div
                className="numeral-outline col-span-3 md:col-span-2 font-display"
                style={{
                  fontSize: 'clamp(3rem, 6vw, 5.5rem)',
                  lineHeight: 0.9,
                  fontStyle: 'italic',
                  letterSpacing: '-0.04em',
                }}
              >
                {step.num}
              </div>

              <div className="col-span-9 md:col-span-4">
                <h3
                  className="font-display text-[#162459]"
                  style={{ fontSize: 'clamp(1.35rem, 2.2vw, 1.9rem)', lineHeight: 1.12, letterSpacing: '-0.015em' }}
                >
                  {step.title}
                </h3>
                <p className="mt-2 text-xs tracking-[0.18em] uppercase text-[#66708C]/80">{step.detail}</p>
              </div>

              <p className="col-span-9 col-start-4 md:col-span-5 md:col-start-8 text-[#66708C] leading-relaxed">
                {step.desc}
              </p>

              {/* Azurová linka, která na hover podtrhne celý řádek */}
              <div className="absolute bottom-[-1px] left-0 h-px w-0 bg-[#009EE2] group-hover:w-full transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]" />
            </article>
          ))}
        </div>

        <div className="mt-10 flex justify-end">
          <Link
            href="/signup"
            className="nav-link inline-flex items-center gap-2 text-[#162459] font-medium"
          >
            Začít prvním krokem <ArrowRight className="w-4 h-4 text-[#009EE2]" />
          </Link>
        </div>
      </div>
    </section>
  )
}
