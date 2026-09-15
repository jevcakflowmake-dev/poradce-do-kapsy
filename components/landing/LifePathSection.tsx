'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { prefersReducedMotion } from '@/lib/motion'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

/**
 * SIGNATURE MOMENT – „cesta životem“
 * Jedna souvislá azurová linka se kreslí scrollem a prochází pěti životními
 * etapami. Každá etapa = jedna oblast poradenství.
 * Desktop: serpentina kolem střední osy; mobil: přímá linka u levého okraje.
 *
 * Proč se dráha počítá v pixelech, a ne ve viewBoxu roztaženém přes
 * `preserveAspectRatio="none"`: s `vector-effect: non-scaling-stroke` se
 * čárkování měří v pixelech obrazovky, zatímco `getTotalLength()` vrací délku
 * v jednotkách viewBoxu. Roztažená dráha je na obrazovce delší (1018×2400 px
 * proti 1000×2000), takže i „plně vykreslená“ čára pokryla jen ~91 % délky
 * a zastavila se před poslední stanicí. Když viewBox odpovídá skutečné
 * velikosti tracku, obě délky jsou stejné a čára dojede až dolů.
 */

const STATIONS = [
  {
    stage: 'Vlastní bydlení',
    title: 'Hypotéka',
    desc: 'První velký krok. Srovnáme nabídky bank a najdeme financování, které vás nebude dusit dalších třicet let.',
  },
  {
    stage: 'Rodina a příjem',
    title: 'Zajištění příjmů',
    desc: 'Když z jednoho příjmu žijí tři lidé, nesmí zmizet ze dne na den. Ochrana životní úrovně pro případ nemoci či úrazu.',
  },
  {
    stage: 'Domov a majetek',
    title: 'Pojištění majetku',
    desc: 'Dům, byt, auto, odpovědnost. Pojištění nastavené podle skutečné hodnoty – ne podle tabulky pojišťovny.',
  },
  {
    stage: 'Rostoucí úspory',
    title: 'Investování',
    desc: 'Peníze na účtu ztrácejí hodnotu. Pravidelné investice, které pracují za vás – srozumitelně a bez hazardu.',
  },
  {
    stage: 'Klidná renta',
    title: 'Příprava na penzi',
    desc: 'Důchod od státu nebude stačit. Penzijní spoření s příspěvkem státu i zaměstnavatele, dokud je čas.',
  },
]

// Svislé pozice stanic v % výšky tracku – musí sedět s dráhou níže
const STATION_TOPS = [10, 30, 50, 70, 90]

// Serpentina v návrhových souřadnicích 1000×2000; do pixelů ji přepočítá
// `buildDesktopPath`. Prochází středem (x=500) přesně v bodech stanic
// a tečna je tam svislá – zákryt teček s linkou pak nezávisí na zaokrouhlení.
type Command = [string, ...number[]]
const DESKTOP_COMMANDS: Command[] = [
  ['M', 500, 0],
  ['C', 500, 70, 500, 140, 500, 200],
  // → apex vpravo, zpět na střed (stanice 2)
  ['C', 500, 310, 800, 290, 800, 400],
  ['C', 800, 510, 500, 490, 500, 600],
  // → apex vlevo (stanice 3)
  ['C', 500, 710, 200, 690, 200, 800],
  ['C', 200, 910, 500, 890, 500, 1000],
  // → apex vpravo (stanice 4)
  ['C', 500, 1110, 800, 1090, 800, 1200],
  ['C', 800, 1310, 500, 1290, 500, 1400],
  // → apex vlevo (stanice 5)
  ['C', 500, 1510, 200, 1490, 200, 1600],
  ['C', 200, 1710, 500, 1690, 500, 1800],
  ['C', 500, 1870, 500, 1930, 500, 2000],
]

function buildDesktopPath(w: number, h: number): string {
  const sx = w / 1000
  const sy = h / 2000
  return DESKTOP_COMMANDS.map(([cmd, ...nums]) =>
    `${cmd} ${nums.map((v, i) => (i % 2 === 0 ? v * sx : v * sy).toFixed(1)).join(' ')}`,
  ).join(' ')
}

// Mobil: přímá linka u levého okraje (střed 56px širokého SVG)
const MOBILE_X = 28

type Size = { w: number; h: number }

export default function LifePathSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState<Size | null>(null)

  // Skutečná velikost tracku – z ní se staví dráha v pixelech
  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    const ro = new ResizeObserver(([entry]) => {
      const w = Math.round(entry.contentRect.width)
      const h = Math.round(entry.contentRect.height)
      setSize((prev) => (prev && prev.w === w && prev.h === h ? prev : { w, h }))
    })
    ro.observe(track)
    return () => ro.disconnect()
  }, [])

  // Kreslení linky – přestaví se při každé změně velikosti tracku
  useEffect(() => {
    const track = trackRef.current
    if (!track || !size) return

    const ctx = gsap.context(() => {
      track.querySelectorAll<SVGPathElement>('.life-path').forEach((path) => {
        const length = path.getTotalLength()
        if (prefersReducedMotion()) {
          gsap.set(path, { strokeDasharray: 'none', strokeDashoffset: 0 })
          return
        }

        // Tabulka „výška → délka dráhy“. Serpentina tráví většinu délky
        // v obloucích, takže posun úměrný scrollu by čelo čáry střídavě
        // předbíhal a zpožďoval proti středu obrazovky. Výška podél dráhy
        // jen roste, tabulku tedy lze obrátit binárním hledáním.
        const SAMPLES = 400
        const ys = new Float32Array(SAMPLES + 1)
        for (let i = 0; i <= SAMPLES; i++) ys[i] = path.getPointAtLength((length * i) / SAMPLES).y
        const lengthAtY = (y: number) => {
          if (y <= ys[0]) return 0
          if (y >= ys[SAMPLES]) return length
          let lo = 0
          let hi = SAMPLES
          while (hi - lo > 1) {
            const mid = (lo + hi) >> 1
            if (ys[mid] < y) lo = mid
            else hi = mid
          }
          const t = (y - ys[lo]) / (ys[hi] - ys[lo] || 1)
          return ((lo + t) / SAMPLES) * length
        }

        gsap.set(path, { strokeDasharray: length, strokeDashoffset: length })
        const head = { y: 0 }
        gsap.to(head, {
          y: size.h,
          ease: 'none',
          scrollTrigger: {
            trigger: track,
            // Čelo čáry drží střed obrazovky: začátek, když je uprostřed
            // vršek tracku, konec, když je uprostřed jeho spodek.
            start: 'top center',
            end: 'bottom center',
            scrub: 0.5,
          },
          onUpdate: () => {
            path.style.strokeDashoffset = String(length - lengthAtY(head.y))
          },
        })
      })
    }, track)

    return () => ctx.revert()
  }, [size])

  // Nástupy obsahu – nezávislé na velikosti, běží jednou
  useEffect(() => {
    const section = sectionRef.current
    if (!section || prefersReducedMotion()) return

    const ctx = gsap.context(() => {
      gsap.from('.life-head > *', {
        y: 40,
        opacity: 0,
        duration: 0.9,
        ease: 'power3.out',
        stagger: 0.1,
        scrollTrigger: { trigger: section, start: 'top 75%' },
      })

      gsap.utils.toArray<HTMLElement>('.life-station').forEach((station) => {
        const dot = station.querySelector('.life-dot')
        const body = station.querySelector('.life-body')
        // Tečka naskočí ve chvíli, kdy k ní dojede čelo čáry (střed obrazovky);
        // text stačí dřív, ať se dá číst ještě před příjezdem linky.
        if (dot) {
          gsap.from(dot, {
            scale: 0,
            duration: 0.5,
            ease: 'back.out(2.2)',
            scrollTrigger: { trigger: station, start: 'top center' },
          })
        }
        if (body) {
          gsap.from(body, {
            y: 36,
            opacity: 0,
            duration: 0.85,
            ease: 'power3.out',
            delay: 0.1,
            scrollTrigger: { trigger: station, start: 'top 70%' },
          })
        }
      })

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
      {/* Inkoust nikdy plochý – zrno + azurové dechy po stranách */}
      <div className="noise-overlay" aria-hidden />
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(700px circle at 12% 18%, rgba(0,158,226,0.10), transparent 55%), radial-gradient(900px circle at 88% 78%, rgba(0,158,226,0.07), transparent 60%)',
        }}
      />

      <div className="relative z-10 max-w-8xl mx-auto px-6 md:px-10 lg:px-16 xl:px-20 pt-24 md:pt-32 pb-10">
        <div className="life-head grid grid-cols-12 gap-6 items-end mb-6 md:mb-2">
          <div className="col-span-12 md:col-span-8">
            <p className="text-xs tracking-[0.3em] uppercase text-[#66708C] mb-3">
              Oblasti · co pro vás řešíme
            </p>
            <h2
              className="font-display text-[#F6F4EE]"
              style={{ fontSize: 'clamp(2.25rem, 5vw, 4rem)', letterSpacing: '-0.025em', lineHeight: 1.02 }}
            >
              Celý život
              <br />
              <span style={{ color: '#009EE2' }}>na jedné lince.</span>
            </h2>
          </div>
          <p className="col-span-12 md:col-span-4 text-[#F6F4EE]/50 text-sm md:text-base leading-relaxed md:text-right md:pb-2">
            Ne pět různých prodejců – jedna osoba, která ví, jak spolu bydlení,
            rodina, majetek i penze souvisí. Scrollujte a projděte si cestu.
          </p>
        </div>
      </div>

      {/* Track s linkou – výška definuje tempo vyprávění */}
      <div ref={trackRef} className="relative z-10 h-[2150px] md:h-[2400px] max-w-8xl mx-auto">
        {/* Dráha se kreslí až po změření tracku, viewBox = skutečné pixely */}
        {size && (
          <>
            <svg
              className="hidden md:block absolute inset-0 w-full h-full"
              viewBox={`0 0 ${size.w} ${size.h}`}
              aria-hidden
            >
              {/* Podkladová „mapa“ trasy – celá cesta slabě viditelná dopředu */}
              <path d={buildDesktopPath(size.w, size.h)} fill="none" stroke="rgba(246,244,238,0.08)" strokeWidth="2" />
              <path className="life-path" d={buildDesktopPath(size.w, size.h)} fill="none" stroke="#009EE2" strokeWidth="2" />
            </svg>
            <svg
              className="md:hidden absolute inset-y-0 left-0 w-14 h-full"
              viewBox={`0 0 56 ${size.h}`}
              aria-hidden
            >
              <path d={`M ${MOBILE_X} 0 L ${MOBILE_X} ${size.h}`} fill="none" stroke="rgba(246,244,238,0.08)" strokeWidth="2" />
              <path className="life-path" d={`M ${MOBILE_X} 0 L ${MOBILE_X} ${size.h}`} fill="none" stroke="#009EE2" strokeWidth="2" />
            </svg>
          </>
        )}

        {STATIONS.map((s, i) => {
          const left = i % 2 === 0 // sudé stanice: obsah vlevo od osy, liché vpravo
          return (
            <div
              key={s.title}
              className="life-station absolute inset-x-0"
              style={{ top: `${STATION_TOPS[i]}%` }}
            >
              {/* Tečka na lince – mobil u levého okraje, desktop na střední ose */}
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

      {/* Konec cesty – CTA na ose linky */}
      <div className="life-cta relative z-10 flex flex-col items-center gap-6 pb-24 md:pb-32 pt-4 px-6">
        <p className="text-[#F6F4EE]/45 text-sm">Kde na té lince právě jste?</p>
        <p className="text-[#F6F4EE]/70 text-center max-w-md leading-relaxed -mt-2">
          Nemusíte to vědět. Od toho je analýza – vyplníte, co o sobě víte,
          a zbytek vám dopovím já.
        </p>
        <Link
            href="/analyza"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#009EE2] text-[#0B111F] font-semibold text-base hover:bg-[#1a9fdd] transition-colors"
          >
            Zjistit, kde mám díry →
          </Link>
      </div>
    </section>
  )
}
