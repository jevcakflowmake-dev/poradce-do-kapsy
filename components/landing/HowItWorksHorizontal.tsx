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

export default function HowItWorksHorizontal() {
  const sectionRef = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    const track = trackRef.current
    if (!section || !track) return

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const isDesktop = window.matchMedia('(min-width: 900px)').matches

    const ctx = gsap.context(() => {
      if (prefersReduced || !isDesktop) {
        gsap.from('.hiw-step', {
          y: 40,
          opacity: 0,
          duration: 0.9,
          ease: 'power3.out',
          stagger: 0.12,
          scrollTrigger: { trigger: section, start: 'top 80%' },
        })
        return
      }

      const distance = track.scrollWidth - window.innerWidth + 80
      const horizontalTween = gsap.to(track, {
        x: -distance,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${distance}`,
          pin: true,
          scrub: 0.8,
          invalidateOnRefresh: true,
          anticipatePin: 1,
        },
      })

      gsap.utils.toArray<HTMLElement>('.hiw-step').forEach((step, i) => {
        gsap.from(step, {
          opacity: 0,
          y: 40,
          duration: 0.7,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: step,
            containerAnimation: horizontalTween,
            start: 'left 80%',
            toggleActions: 'play none none reverse',
          },
          delay: i * 0.05,
        })
      })
    }, section)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      id="jak-to-funguje"
      className="relative bg-[#f8f9fc] overflow-hidden"
    >
      {/* Header */}
      <div className="px-6 md:px-10 lg:px-16 xl:px-20 pt-20 md:pt-28 pb-10 md:pb-16">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <div className="section-numeral text-[3.5rem] md:text-[5rem] mb-2">02</div>
            <p className="text-xs tracking-[0.3em] uppercase text-[#818EAF] mb-2">Proces · jak to funguje</p>
            <h2
              className="font-display text-[#162459]"
              style={{ fontSize: 'clamp(2rem, 4.5vw, 3.5rem)', letterSpacing: '-0.02em', lineHeight: 1.05 }}
            >
              Čtyři kroky —
              <br />
              <span style={{ fontStyle: 'italic', color: '#009EE2' }}>žádné schůzky mezi nimi.</span>
            </h2>
          </div>
          <p className="text-[#818EAF] text-sm md:text-base max-w-sm leading-relaxed">
            Od prvního kliknutí po osobní návrh uběhne maximálně 48 hodin. Scrollujte —
            průvodce vede vás.
          </p>
        </div>
      </div>

      {/* Horizontal track (desktop) / vertical stack (mobile) */}
      <div className="relative h-auto lg:h-screen lg:max-h-[820px]">
        <div
          ref={trackRef}
          className="hiw-track flex flex-col lg:flex-row gap-6 lg:gap-10 px-6 md:px-10 lg:pl-16 xl:pl-20 lg:pr-[40vw] pb-20"
          style={{ willChange: 'transform' }}
        >
          {STEPS.map((step, i) => (
            <article
              key={step.num}
              className="hiw-step relative shrink-0 w-full lg:w-[460px] bg-white rounded-3xl border border-[#E8E9EE] p-8 md:p-10 flex flex-col gap-6 shadow-[0_1px_0_rgba(22,36,89,0.04)]"
            >
              <div className="flex items-start justify-between">
                <div
                  className="font-display"
                  style={{
                    fontSize: 'clamp(5rem, 10vw, 9rem)',
                    lineHeight: 0.85,
                    fontStyle: 'italic',
                    fontWeight: 500,
                    color: '#009EE2',
                    letterSpacing: '-0.04em',
                  }}
                >
                  {step.num}
                </div>
                <span className="text-xs font-mono text-[#818EAF] tracking-wider mt-4">
                  krok {i + 1}/4
                </span>
              </div>

              <div className="h-px w-full bg-[#E8E9EE]" />

              <div className="flex-1">
                <h3
                  className="font-display text-[#162459] mb-3"
                  style={{ fontSize: 'clamp(1.35rem, 2vw, 1.75rem)', lineHeight: 1.15, letterSpacing: '-0.01em' }}
                >
                  {step.title}
                </h3>
                <p className="text-[#162459]/80 leading-relaxed mb-5">{step.desc}</p>
                <div className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-[#009EE2]/8 text-[#009EE2] border border-[#009EE2]/20">
                  {step.detail}
                </div>
              </div>

              {i === STEPS.length - 1 && (
                <Link
                  href="/signup"
                  className="mt-2 inline-flex items-center gap-2 text-[#009EE2] font-semibold text-sm hover:gap-3 transition-all"
                >
                  Začít zdarma <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
