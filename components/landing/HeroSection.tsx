'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ArrowRight, ArrowDown } from 'lucide-react'
import { prefersReducedMotion } from '@/lib/motion'
import HeroVideo from '@/components/landing/HeroVideo'

const HEADLINE_LINE_1 = ['Finanční', 'plán']
const HEADLINE_LINE_2 = ['pro', 'celý', 'život.']

export default function HeroSection() {
  // Kritérium 14: nav je nahoře průhledná a teprve po scrollu se podlije
  // papírem s jemným blurem, ať hero nerozděluje pruh přes celou šířku.
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    if (prefersReducedMotion()) return

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
        {/* Ambientní podklad – pod závojem, tedy pod vším ostatním */}
        <HeroVideo />
        {/* Zrno + azurový dech – papír nikdy není plochý */}
        <div className="hero-glow" aria-hidden />
        <div className="noise-paper" aria-hidden />

        {/* Navbar – papír, inkoustový text, žádný blur box */}
        <nav
          className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-500 ${
            scrolled
              ? 'bg-[#F6F4EE]/85 backdrop-blur-md border-b border-[#E4DFD2]'
              : 'bg-transparent border-b border-transparent'
          }`}
        >
          <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16 xl:px-20 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {/* Logo – inkoustový čtverec s azurovou tečkou, žádná ikona ze setu */}
              <div className="w-8 h-8 bg-[#162459] flex items-end justify-end p-1.5">
                <span className="block w-1.5 h-1.5 rounded-full bg-[#009EE2]" />
              </div>
              <span className="font-semibold text-[#162459] text-base tracking-tight">
                Poradce do kapsy
              </span>
            </div>
            <div className="flex items-center gap-5 lg:gap-7">
              <a href="#jak-to-funguje" className="nav-link hidden lg:inline-block text-sm text-[#66708C] hover:text-[#162459] transition-colors">
                Jak to funguje
              </a>
              <a href="#co-dostanete" className="nav-link hidden lg:inline-block text-sm text-[#66708C] hover:text-[#162459] transition-colors">
                Co dostanete
              </a>
              <a href="#otazky" className="nav-link hidden lg:inline-block text-sm text-[#66708C] hover:text-[#162459] transition-colors">
                Otázky
              </a>
              <a href="#prihlaseni" className="nav-link hidden sm:inline-block text-sm text-[#66708C] hover:text-[#162459] transition-colors">
                Přihlásit se
              </a>
              <Link
                href="/analyza"
                className="text-sm font-semibold px-4 py-2 bg-[#162459] text-[#F6F4EE] hover:bg-[#0e1a3d] transition-colors whitespace-nowrap"
              >
                Analýza zdarma
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero – asymetrická kompozice: copy vlevo, marginálie vpravo */}
        <div className="relative z-10 flex-1 flex items-center pt-28 pb-10 md:pt-32 md:pb-12 px-6 md:px-10 lg:px-16 xl:px-20 w-full">
          <div className="max-w-7xl mx-auto w-full grid grid-cols-12 gap-6 items-end">
            <div className="col-span-12 lg:col-span-9">
              <p className="hero-kicker flex flex-wrap items-center gap-x-3 gap-y-1 text-xs tracking-[0.3em] uppercase text-[#66708C] mb-6">
                <span className="inline-block w-10 h-px bg-[#009EE2]" />
                Jakub Jevčák · certifikovaný poradce ProfiFP a OVB Allfinanz
              </p>

              <h1
                className="font-display text-[#162459] mb-6"
                style={{
                  // min(9vw, 13vh) – na širokém, ale nízkém okně by samotné vw
                  // headline přerostlo a hero by se do viewportu nevešlo.
                  fontSize: 'clamp(2.75rem, min(9vw, 13vh), 7rem)',
                  lineHeight: 0.95,
                  letterSpacing: '-0.035em',
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
                      style={w === 'život.' ? { color: '#009EE2' } : undefined}
                    >
                      <span>{w}</span>
                    </span>
                  ))}
                </span>
              </h1>

              <p className="hero-sub text-base md:text-lg text-[#66708C] max-w-xl leading-relaxed mb-8">
                Odpovíte na pár otázek o své situaci a do 48 hodin ode mě dostanete
                hotový plán: kde máte díru v zajištění, co s ní udělat a kolik to
                bude stát u tří konkrétních společností. Zdarma a nezávazně.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center mb-8">
                <Link
                  href="/analyza"
                  className="hero-cta group w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-[#162459] font-medium text-[#F6F4EE] text-base hover:bg-[#0e1a3d] transition-colors"
                >
                  Chci svůj plán zdarma
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <a
                  href="#sluzby"
                  className="hero-cta nav-link text-[#162459] font-medium text-base py-2"
                >
                  Co pro vás řešíme
                </a>
              </div>

              <p className="hero-fine text-sm text-[#66708C]/70">
                Bez registrace · Nikdo vám nezavolá, dokud si to sami nevyžádáte ·
                Rozdělané můžete kdykoliv zavřít a vrátit se
              </p>
            </div>

            {/* Marginálie – svislá poznámka na pravém okraji, láme mřížku */}
            <div className="hero-aside hidden lg:flex col-span-3 flex-col items-end gap-6 pb-2">
              <p
                className="text-xs tracking-[0.25em] uppercase text-[#66708C]"
                style={{ writingMode: 'vertical-rl' }}
              >
                Pojištění · Penze · Investice · Hypotéka
              </p>
              <div className="w-px h-24 bg-[#162459]/20" />
              <p className="text-right text-sm text-[#66708C] max-w-[180px] leading-relaxed">
                Jeden člověk, který vidí všechny vaše smlouvy najednou – ne pět
                prodejců, každý za svoje.
              </p>
            </div>
          </div>
        </div>

        {/* Scroll hint – začátek cesty: tečka a linka, která vede do signature sekce */}
        <div className="hero-scroll-hint relative z-10 flex flex-col items-center gap-2 pb-8">
          <span className="text-[11px] tracking-[0.3em] uppercase text-[#66708C]/70">Vaše cesta začíná zde</span>
          <ArrowDown className="w-4 h-4 text-[#009EE2] animate-bounce" strokeWidth={1.5} />
        </div>
      </header>
    </div>
  )
}
