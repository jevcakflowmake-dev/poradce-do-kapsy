'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ArrowRight, ArrowDown } from 'lucide-react'
import MagneticButton from '@/components/motion/MagneticButton'

const HEADLINE_LINE_1 = ['Finanční', 'plán']
const HEADLINE_LINE_2 = ['pro', 'celý', 'život.']

export default function HeroSection() {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const ctx = gsap.context(() => {
      const nav = root.querySelector('nav')
      const kicker = root.querySelector('.hero-kicker')
      const words = root.querySelectorAll<HTMLElement>('.hero-word > span')
      const sub = root.querySelector('.hero-sub')
      const ctas = root.querySelectorAll('.hero-cta')
      const fine = root.querySelector('.hero-fine')
      const aside = root.querySelector('.hero-aside')
      const scrollHint = root.querySelector('.hero-scroll-hint')

      gsap.set([kicker, sub, ctas, fine], { opacity: 0, y: 24 })
      gsap.set(words, { yPercent: 105, opacity: 0 })
      gsap.set(aside, { opacity: 0, x: 24 })
      gsap.set(scrollHint, { opacity: 0 })
      if (nav) gsap.set(nav, { y: -24, opacity: 0 })

      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
      if (nav) tl.to(nav, { y: 0, opacity: 1, duration: 0.6 })
      tl.to(kicker, { opacity: 1, y: 0, duration: 0.5 }, '-=0.25')
        .to(words, {
          yPercent: 0,
          opacity: 1,
          duration: 0.9,
          stagger: 0.09,
          ease: 'power4.out',
        }, '-=0.2')
        .to(sub, { opacity: 1, y: 0, duration: 0.7 }, '-=0.5')
        .to(ctas, { opacity: 1, y: 0, duration: 0.55, stagger: 0.08 }, '-=0.4')
        .to(fine, { opacity: 1, y: 0, duration: 0.5 }, '-=0.3')
        .to(aside, { opacity: 1, x: 0, duration: 0.8 }, '-=0.6')
        .to(scrollHint, { opacity: 1, duration: 0.6 }, '-=0.2')
    }, root)

    return () => ctx.revert()
  }, [])

  return (
    <div ref={rootRef}>
      <header className="relative min-h-screen flex flex-col bg-[#F6F4EE] overflow-hidden">
        {/* Zrno + azurový dech — papír nikdy není plochý */}
        <div className="hero-glow" aria-hidden />
        <div className="noise-paper" aria-hidden />

        {/* Navbar — papír, inkoustový text, žádný blur box */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-[#F6F4EE]/85 backdrop-blur-md border-b border-[#E4DFD2]">
          <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16 xl:px-20 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {/* Logo — inkoustový čtverec s azurovou tečkou, žádná ikona ze setu */}
              <div className="w-8 h-8 bg-[#162459] flex items-end justify-end p-1.5">
                <span className="block w-1.5 h-1.5 rounded-full bg-[#009EE2]" />
              </div>
              <span className="font-semibold text-[#162459] text-base tracking-tight">
                Poradce do kapsy
              </span>
            </div>
            <div className="flex items-center gap-7">
              <a href="#sluzby" className="nav-link hidden sm:inline-block text-sm text-[#66708C] hover:text-[#162459] transition-colors">
                Co řešíme
              </a>
              <a href="#jak-to-funguje" className="nav-link hidden sm:inline-block text-sm text-[#66708C] hover:text-[#162459] transition-colors">
                Jak to funguje
              </a>
              <a
                href="#prihlaseni"
                className="text-sm font-medium px-4 py-2 border border-[#162459]/25 text-[#162459] hover:bg-[#162459] hover:text-[#F6F4EE] transition-colors"
              >
                Přihlásit se
              </a>
            </div>
          </div>
        </nav>

        {/* Hero — asymetrická kompozice: copy vlevo, marginálie vpravo */}
        <div className="relative z-10 flex-1 flex items-center pt-32 pb-16 md:pt-36 px-6 md:px-10 lg:px-16 xl:px-20 w-full">
          <div className="max-w-7xl mx-auto w-full grid grid-cols-12 gap-6 items-end">
            <div className="col-span-12 lg:col-span-9">
              <p className="hero-kicker flex items-center gap-3 text-xs tracking-[0.3em] uppercase text-[#66708C] mb-8">
                <span className="inline-block w-10 h-px bg-[#009EE2]" />
                Certifikovaný poradce ProfiFP · OVB Allfinanz
              </p>

              <h1
                className="font-display text-[#162459] mb-8"
                style={{
                  fontSize: 'clamp(3rem, 9vw, 8rem)',
                  lineHeight: 0.95,
                  letterSpacing: '-0.035em',
                  fontWeight: 500,
                }}
              >
                <span className="block">
                  {HEADLINE_LINE_1.map((w, i) => (
                    <span key={`l1-${i}`} className="hero-word">
                      <span>{w}</span>
                    </span>
                  ))}
                </span>
                <span className="block">
                  {HEADLINE_LINE_2.map((w, i) => (
                    <span
                      key={`l2-${i}`}
                      className="hero-word"
                      style={w === 'život.' ? { fontStyle: 'italic', color: '#009EE2' } : undefined}
                    >
                      <span>{w}</span>
                    </span>
                  ))}
                </span>
              </h1>

              <p className="hero-sub text-lg md:text-xl text-[#66708C] max-w-xl leading-relaxed mb-10">
                Vyplňte dotazník a do 48 hodin dostanete osobní návrh pojištění,
                penzijního spoření nebo investic — bez schůzek, bez závazků, zdarma.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center mb-8">
                <MagneticButton className="hero-cta w-full sm:w-auto">
                  <Link
                    href="/signup"
                    className="group flex items-center justify-center gap-2 px-8 py-4 bg-[#162459] font-medium text-[#F6F4EE] text-base hover:bg-[#0e1a3d] transition-colors"
                  >
                    Začít dotazník zdarma
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </MagneticButton>
                <a
                  href="#sluzby"
                  className="hero-cta nav-link text-[#162459] font-medium text-base py-2"
                >
                  Co pro vás řešíme
                </a>
              </div>

              <p className="hero-fine text-sm text-[#66708C]/70">
                Dotazník zabere ~10 minut · Bez závazků · Zdarma
              </p>
            </div>

            {/* Marginálie — svislá poznámka na pravém okraji, láme mřížku */}
            <div className="hero-aside hidden lg:flex col-span-3 flex-col items-end gap-6 pb-2">
              <p
                className="text-xs tracking-[0.25em] uppercase text-[#66708C]"
                style={{ writingMode: 'vertical-rl' }}
              >
                Pojištění · Penze · Investice · Hypotéka
              </p>
              <div className="w-px h-24 bg-[#162459]/20" />
              <p className="text-right text-sm text-[#66708C] max-w-[180px] leading-relaxed">
                Jedna osoba, která ví, jak vaše finance souvisí.
              </p>
            </div>
          </div>
        </div>

        {/* Scroll hint — začátek cesty: tečka a linka, která vede do signature sekce */}
        <div className="hero-scroll-hint relative z-10 flex flex-col items-center gap-2 pb-8">
          <span className="text-[11px] tracking-[0.3em] uppercase text-[#66708C]/70">Vaše cesta začíná zde</span>
          <ArrowDown className="w-4 h-4 text-[#009EE2] animate-bounce" strokeWidth={1.5} />
        </div>
      </header>
    </div>
  )
}
