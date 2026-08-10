'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import MagneticButton from '@/components/motion/MagneticButton'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

/**
 * SIGNATURE MOMENT — „cesta životem“
 * Jedna souvislá azurová linka se kreslí scrollem (strokeDashoffset scrub)
 * a prochází pěti životními etapami. Každá etapa = jedna oblast poradenství.
 * Desktop: serpentina kolem střední osy; mobil: přímá linka u levého okraje.
 */

const STATIONS = [
  {
    stage: 'Etapa 01 · Vlastní bydlení',
    title: 'Hypotéka',
    desc: 'První velký krok. Srovnáme nabídky bank a najdeme financování, které vás nebude dusit dalších třicet let.',
  },
  {
    stage: 'Etapa 02 · Rodina a příjem',
    title: 'Zajištění příjmů',
    desc: 'Když z jednoho příjmu žijí tři lidé, nesmí zmizet ze dne na den. Ochrana životní úrovně pro případ nemoci či úrazu.',
  },
  {
    stage: 'Etapa 03 · Domov a majetek',
    title: 'Pojištění majetku',
    desc: 'Dům, byt, auto, odpovědnost. Pojištění nastavené podle skutečné hodnoty — ne podle tabulky pojišťovny.',
  },
  {
    stage: 'Etapa 04 · Rostoucí úspory',
    title: 'Investování',
    desc: 'Peníze na účtu ztrácejí hodnotu. Pravidelné investice, které pracují za vás — srozumitelně a bez hazardu.',
  },
  {
    stage: 'Etapa 05 · Klidná renta',
    title: 'Příprava na penzi',
    desc: 'Důchod od státu nebude stačit. Penzijní spoření s příspěvkem státu i zaměstnavatele, dokud je čas.',
  },
]

// Svislé pozice stanic v % výšky tracku — musí sedět s SVG path níže
const STATION_TOPS = [10, 30, 50, 70, 90]

// Serpentina: prochází středem (x=500) přesně v bodech stanic,
// tečna v každé stanici je SVISLÁ — zákryt teček s linkou je pak
// necitlivý na zaokrouhlení výšky tracku napříč breakpointy.
const DESKTOP_PATH = [
  'M 500 0',
  'C 500 70, 500 140, 500 200',
  // → apex vpravo, zpět na střed (stanice 2)
  'C 500 310, 800 290, 800 400',
  'C 800 510, 500 490, 500 600',
  // → apex vlevo (stanice 3)
  'C 500 710, 200 690, 200 800',
  'C 200 910, 500 890, 500 1000',
  // → apex vpravo (stanice 4)
  'C 500 1110, 800 1090, 800 1200',
  'C 800 1310, 500 1290, 500 1400',
  // → apex vlevo (stanice 5)
  'C 500 1510, 200 1490, 200 1600',
  'C 200 1710, 500 1690, 500 1800',
  'C 500 1870, 500 1930, 500 2000',
].join(' ')

// Mobil: přímá linka u levého okraje (x=28 z viewBox šířky 56)
const MOBILE_PATH = 'M 28 0 L 28 2000'

export default function LifePathSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    const track = trackRef.current
    if (!section || !track) return

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const ctx = gsap.context(() => {
      // Kreslení linky — scrub svázaný se scrollem přes celý track
      track.querySelectorAll<SVGPathElement>('.life-path').forEach((path) => {
        const length = path.getTotalLength()
        if (prefersReduced) {
          gsap.set(path, { strokeDasharray: 'none' })
          return
        }
        gsap.set(path, { strokeDasharray: length, strokeDashoffset: length })
        gsap.to(path, {
          strokeDashoffset: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: track,
            start: 'top 65%',
            end: 'bottom 80%',
            scrub: 0.6,
          },
        })
      })

      // Hlavička sekce
      gsap.from('.life-head > *', {
        y: 40,
        opacity: 0,
        duration: 0.9,
        ease: 'power3.out',
        stagger: 0.1,
        scrollTrigger: { trigger: section, start: 'top 75%' },
      })

      // Stanice — obsah + tečka se objeví, když k nim linka dorazí
      gsap.utils.toArray<HTMLElement>('.life-station').forEach((station) => {
        const dot = station.querySelector('.life-dot')
        const body = station.querySelector('.life-body')
        const st = { trigger: station, start: 'top 70%' }
        if (dot) {
          gsap.from(dot, {
            scale: 0,
            duration: 0.5,
            ease: 'back.out(2.2)',
            scrollTrigger: st,
          })
        }
        if (body) {
          gsap.from(body, {
            y: 36,
            opacity: 0,
            duration: 0.85,
            ease: 'power3.out',
            delay: 0.1,
            scrollTrigger: st,
          })
        }
      })

      // Závěrečné CTA
      gsap.from('.life-cta', {
        y: 30,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.life-cta', start: 'top 88%' },
      })
    }, section)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      id="sluzby"
      className="relative bg-[#0B111F] overflow-hidden"
    >
      {/* Inkoust nikdy plochý — zrno + azurové dechy po stranách */}
      <div className="noise-overlay" aria-hidden />
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(700px circle at 12% 18%, rgba(0,158,226,0.10), transparent 55%), radial-gradient(900px circle at 88% 78%, rgba(0,158,226,0.07), transparent 60%)',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 lg:px-16 xl:px-20 pt-24 md:pt-32 pb-10">
        <div className="life-head grid grid-cols-12 gap-6 items-end mb-6 md:mb-2">
          <div className="col-span-12 md:col-span-8">
            <div className="section-numeral-dark text-[3.5rem] md:text-[5rem] mb-3">02</div>
            <p className="text-xs tracking-[0.3em] uppercase text-[#66708C] mb-3">
              Oblasti · co pro vás řešíme
            </p>
            <h2
              className="font-display text-[#F6F4EE]"
              style={{ fontSize: 'clamp(2.25rem, 5vw, 4rem)', letterSpacing: '-0.025em', lineHeight: 1.02 }}
            >
              Celý život
              <br />
              <span style={{ fontStyle: 'italic', color: '#009EE2' }}>na jedné lince.</span>
            </h2>
          </div>
          <p className="col-span-12 md:col-span-4 text-[#F6F4EE]/50 text-sm md:text-base leading-relaxed md:text-right md:pb-2">
            Ne pět různých prodejců — jedna osoba, která ví, jak spolu bydlení,
            rodina, majetek i penze souvisí. Scrollujte a projděte si cestu.
          </p>
        </div>
      </div>

      {/* Track s linkou — výška definuje tempo vyprávění */}
      <div ref={trackRef} className="relative z-10 h-[2150px] md:h-[2400px] max-w-7xl mx-auto">
        {/* Podkladová „mapa“ trasy — celá cesta slabě viditelná dopředu */}
        <svg
          className="hidden md:block absolute inset-0 w-full h-full"
          viewBox="0 0 1000 2000"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path d={DESKTOP_PATH} fill="none" stroke="rgba(246,244,238,0.08)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          <path className="life-path" d={DESKTOP_PATH} fill="none" stroke="#009EE2" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        </svg>
        <svg
          className="md:hidden absolute inset-y-0 left-0 w-14 h-full"
          viewBox="0 0 56 2000"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path d={MOBILE_PATH} fill="none" stroke="rgba(246,244,238,0.08)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          <path className="life-path" d={MOBILE_PATH} fill="none" stroke="#009EE2" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        </svg>

        {STATIONS.map((s, i) => {
          const left = i % 2 === 0 // sudé stanice: obsah vlevo od osy, liché vpravo
          return (
            <div
              key={s.title}
              className="life-station absolute inset-x-0"
              style={{ top: `${STATION_TOPS[i]}%` }}
            >
              {/* Tečka na lince — mobil u levého okraje, desktop na střední ose */}
              <div className="life-dot absolute left-7 md:left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border border-[#F6F4EE]/30 bg-[#0B111F] flex items-center justify-center">
                <span className="block w-1.5 h-1.5 rounded-full bg-[#009EE2]" />
              </div>

              <div
                className={`life-body absolute left-16 right-5 -translate-y-1/2 md:w-[38%] md:max-w-md ${
                  left
                    ? 'md:right-auto md:left-[6%] lg:left-[8%] md:text-right'
                    : 'md:left-auto md:right-[6%] lg:right-[8%] md:text-left'
                }`}
              >
                <p className={`flex items-center gap-3 text-[11px] tracking-[0.28em] uppercase text-[#66708C] mb-3 ${left ? 'md:flex-row-reverse' : ''}`}>
                  <span className="inline-block w-8 h-px bg-[#009EE2]" />
                  {s.stage}
                </p>
                <h3
                  className="font-display text-[#F6F4EE] mb-3"
                  style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', letterSpacing: '-0.02em', lineHeight: 1.08 }}
                >
                  {s.title}
                </h3>
                <p className="text-[#F6F4EE]/55 leading-relaxed text-[15px] md:text-base">{s.desc}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Konec cesty — CTA na ose linky */}
      <div className="life-cta relative z-10 flex flex-col items-center gap-6 pb-24 md:pb-32 pt-4 px-6">
        <p className="text-[#F6F4EE]/45 text-sm">Kde na té lince právě jste?</p>
        <p className="text-[#F6F4EE]/70 text-center max-w-md leading-relaxed -mt-2">
          Nemusíte to vědět. Od toho je analýza — vyplníte, co o sobě víte,
          a zbytek vám dopovím já.
        </p>
        <MagneticButton>
          <Link
            href="/analyza"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#009EE2] text-[#0B111F] font-semibold text-base hover:bg-[#1a9fdd] transition-colors"
          >
            Zjistit, kde mám díry →
          </Link>
        </MagneticButton>
      </div>
    </section>
  )
}
