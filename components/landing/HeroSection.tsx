'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { Shield, Clock, MessageCircle, ArrowRight } from 'lucide-react'
import ParticleHero from '@/components/ui/particle-hero'
import MagneticButton from '@/components/motion/MagneticButton'

const HEADLINE_LINE_1 = ['Profesionální', 'finanční']
const HEADLINE_LINE_2 = ['poradenství', 'online']

export default function HeroSection() {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const ctx = gsap.context(() => {
      const nav = root.querySelector('nav')
      const kicker = root.querySelector('.hero-kicker')
      const rule = root.querySelector('.hero-rule')
      const words = root.querySelectorAll<HTMLElement>('.hero-word > span')
      const sub = root.querySelector('.hero-sub')
      const ctas = root.querySelectorAll('.hero-cta')
      const fine = root.querySelector('.hero-fine')
      const pills = root.querySelectorAll('.hero-pill')

      gsap.set([kicker, rule, sub, ctas, fine, pills], { opacity: 0, y: 24 })
      gsap.set(words, { yPercent: 105, opacity: 0 })
      if (nav) gsap.set(nav, { y: -24, opacity: 0 })

      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
      if (nav) tl.to(nav, { y: 0, opacity: 1, duration: 0.6 })
      tl.to(kicker, { opacity: 1, y: 0, duration: 0.5 }, '-=0.25')
        .to(rule, { opacity: 1, y: 0, duration: 0.5 }, '-=0.35')
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
        .to(pills, { opacity: 1, y: 0, duration: 0.6, stagger: 0.08 }, '-=0.45')
    }, root)

    return () => ctx.revert()
  }, [])

  return (
    <div ref={rootRef}>
      <ParticleHero className="relative min-h-screen flex items-center">
        {/* Radial accent glow + noise texture — never flat dark */}
        <div className="hero-glow" aria-hidden />
        <div className="noise-overlay" aria-hidden />

        {/* Navbar overlay */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-[#162459]/80 backdrop-blur-md border-b border-white/10">
          <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16 xl:px-20 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#009EE2] flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" strokeWidth={1.8} />
              </div>
              <span className="font-bold text-white text-lg tracking-tight">
                Poradce do kapsy
              </span>
            </div>
            <div className="flex items-center gap-6">
              <a href="#jak-to-funguje" className="nav-link hidden sm:inline-block text-sm text-white/60 hover:text-white font-medium">
                Jak to funguje
              </a>
              <a href="#sluzby" className="nav-link hidden sm:inline-block text-sm text-white/60 hover:text-white font-medium">
                Služby
              </a>
              <a
                href="#prihlaseni"
                className="text-sm font-semibold px-4 py-2 rounded-xl border border-[#009EE2]/40 text-[#009EE2] hover:bg-[#009EE2]/10 transition-colors"
              >
                Přihlásit se
              </a>
            </div>
          </div>
        </nav>

        {/* Hero content */}
        <div className="relative z-10 pt-32 pb-20 md:pt-40 md:pb-28 px-6 md:px-10 lg:px-16 xl:px-20 w-full">
          <div className="max-w-6xl mx-auto text-center">
            <div className="hero-kicker inline-flex items-center gap-2 text-sm font-medium px-5 py-2 rounded-full mb-8 border border-[#009EE2]/30 bg-[#009EE2]/10 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-[#009EE2] animate-pulse" />
              <span className="text-[#009EE2]">Certifikovaný poradce ProfiFP · OVB Allfinanz</span>
            </div>

            <div className="hero-rule w-20 h-px bg-[#009EE2] mx-auto mb-10" />

            <h1
              className="font-display tracking-tight mb-7 text-white"
              style={{
                fontSize: 'clamp(3rem, 8vw, 7.5rem)',
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
                    style={w === 'poradenství' ? { fontStyle: 'italic', color: '#009EE2' } : undefined}
                  >
                    <span>{w}</span>
                  </span>
                ))}
              </span>
            </h1>

            <p className="hero-sub text-lg md:text-xl text-white/55 max-w-2xl mx-auto leading-relaxed mb-10">
              Vyplňte dotazník, dostanete osobní návrh pojištění, penzijního spoření
              nebo investic — bez schůzek, bez závazků, zcela zdarma.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
              <MagneticButton className="hero-cta w-full sm:w-auto">
                <Link
                  href="/signup"
                  className="group flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-white text-base transition-shadow hover:shadow-2xl hover:shadow-[#009EE2]/30"
                  style={{ background: 'linear-gradient(135deg, #009EE2 0%, #0088c6 100%)' }}
                >
                  Začít dotazník zdarma
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </MagneticButton>
              <a
                href="#jak-to-funguje"
                className="hero-cta w-full sm:w-auto px-8 py-4 rounded-xl font-semibold text-white/80 text-base border border-white/20 hover:bg-white/5 transition-colors text-center"
              >
                Jak to funguje?
              </a>
            </div>

            <p className="hero-fine text-sm text-white/35">
              Dotazník zabere ~10 minut · Bez závazků · Zdarma
            </p>
          </div>

          {/* Quick benefits strip */}
          <div className="max-w-4xl mx-auto mt-16 md:mt-20">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: Clock, text: 'Osobní návrh do 48 hodin' },
                { icon: Shield, text: '100% bezplatné poradenství' },
                { icon: MessageCircle, text: 'Přímý chat s poradcem' },
              ].map(({ icon: Icon, text }) => (
                <div
                  key={text}
                  className="hero-pill flex items-center gap-3 px-5 py-3 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm"
                >
                  <Icon className="w-5 h-5 text-[#009EE2] shrink-0" />
                  <span className="text-sm text-white/70">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ParticleHero>
    </div>
  )
}
