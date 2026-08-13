'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { prefersReducedMotion } from '@/lib/motion'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

const STEPS = [
  {
    title: 'Řeknete mi, jak na tom jste',
    desc: 'Deset minut otázek o příjmu, bydlení, rodině a tom, co vás na penězích trápí. Účet zakládat nemusíte, rozdělané se ukládá.',
    detail: 'Bez registrace · Povinné jen jméno a e-mail',
  },
  {
    title: 'Projdu to a napíšu plán',
    desc: 'Podívám se i na smlouvy, které už máte, a u každé oblasti napíšu, jestli je v pořádku, nebo v ní máte díru – a co s tím.',
    detail: 'Do 48 hodin, obvykle dřív',
  },
  {
    title: 'Doptáte se na cokoliv',
    desc: 'Přímo v aplikaci, písemně, kdy se vám to hodí. Nemusíte nic chápat napoprvé a nemusíte předstírat, že rozumíte.',
    detail: 'Odpovídám obvykle do 24 hodin',
  },
  {
    title: 'Rozhodnete se – i pro nic',
    desc: 'Vyberete si variantu, nebo mi napíšete, že to teď řešit nechcete. Obojí je v pořádku a nic za to neplatíte.',
    detail: 'Podepisuje se až tehdy, když sami chcete',
  },
]

/**
 * Editorial seznam kroků – řádky jako položky smlouvy.
 * Žádné karty, žádné stíny: jen typografie, hairline mezi řádky
 * a azurová linka, která na hover podtrhne celý řádek.
 */
export default function HowItWorksSection() {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (prefersReducedMotion()) return

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
            <p className="text-xs tracking-[0.3em] uppercase text-[#66708C] mb-3">Proces · jak to funguje</p>
            <h2
              className="font-display text-[#162459]"
              style={{ fontSize: 'clamp(2rem, 4.5vw, 3.5rem)', letterSpacing: '-0.02em', lineHeight: 1.05 }}
            >
              Čtyři kroky –
              <br />
              <span style={{ color: '#009EE2' }}>žádné schůzky mezi nimi.</span>
            </h2>
          </div>
          <p className="col-span-12 md:col-span-5 text-[#66708C] text-sm md:text-base max-w-sm md:justify-self-end leading-relaxed">
            Od prvního kliknutí po hotový plán obvykle 48 hodin.
            Celé z gauče, vlastním tempem a bez jediného telefonátu.
          </p>
        </div>

        <div className="hiw-rows border-t border-[#E4DFD2]">
          {STEPS.map((step, i) => (
            <article
              key={step.title}
              className="hiw-row group relative grid grid-cols-12 gap-4 md:gap-8 items-baseline py-8 md:py-10 border-b border-[#E4DFD2]"
            >
              {/* Bez numerálu: pořadí nese samotné pořadí řádků a hairline mezi nimi */}
              <div className="col-span-12 md:col-span-5">
                <h3
                  className="font-display text-[#162459]"
                  style={{ fontSize: 'clamp(1.35rem, 2.2vw, 1.9rem)', lineHeight: 1.12, letterSpacing: '-0.015em' }}
                >
                  {step.title}
                </h3>
                <p className="mt-2 text-xs tracking-[0.18em] uppercase text-[#66708C]/80">{step.detail}</p>
              </div>

              <p className="col-span-12 md:col-span-6 md:col-start-7 text-[#66708C] leading-relaxed">
                {step.desc}
              </p>

              {/* Azurová linka, která na hover podtrhne celý řádek */}
              <div className="absolute bottom-[-1px] left-0 h-px w-0 bg-[#009EE2] group-hover:w-full transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]" />
            </article>
          ))}
        </div>

        <div className="mt-10 flex justify-end">
          <Link
            href="/analyza"
            className="group inline-flex items-center gap-2 px-7 py-3.5 bg-[#162459] font-semibold text-[#F6F4EE] text-sm hover:bg-[#0e1a3d] transition-colors"
          >
            Začít prvním krokem
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  )
}
