'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import InlineLogin from '@/components/auth/InlineLogin'
import MagneticButton from '@/components/motion/MagneticButton'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

export default function CtaSection() {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ctx = gsap.context(() => {
      gsap.from('.cta-left > *', {
        y: 40,
        opacity: 0,
        duration: 0.85,
        ease: 'power3.out',
        stagger: 0.1,
        scrollTrigger: { trigger: el, start: 'top 80%' },
      })
      gsap.from('.cta-card', {
        y: 40,
        opacity: 0,
        duration: 0.9,
        ease: 'power3.out',
        delay: 0.15,
        scrollTrigger: { trigger: el, start: 'top 80%' },
      })
    }, el)
    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={ref}
      id="prihlaseni"
      className="relative px-6 md:px-10 lg:px-16 xl:px-20 py-24 md:py-32 bg-[#0B111F] overflow-hidden"
    >
      <div className="noise-overlay" aria-hidden />
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(600px circle at 80% 20%, rgba(0,158,226,0.12), transparent 55%)' }}
      />

      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="cta-left">
            <div className="section-numeral-dark text-[3.5rem] md:text-[5rem] mb-3">05</div>
            <p className="text-xs tracking-[0.3em] uppercase text-[#66708C] mb-3">Začněte · zdarma, bez schůzky</p>
            <h2
              className="font-display text-[#F6F4EE] mb-5"
              style={{ fontSize: 'clamp(2rem, 4vw, 3.25rem)', letterSpacing: '-0.02em', lineHeight: 1.05 }}
            >
              Návrh přesně pro vás <span style={{ fontStyle: 'italic', color: '#009EE2' }}>do 48 hodin.</span>
            </h2>
            <p className="text-[#F6F4EE]/55 leading-relaxed mb-8 max-w-md">
              Máte už účet? Přihlaste se vpravo. Nový klient? Vyplňte analýzu — 10 minut
              a dostanete osobní finanční plán.
            </p>
            <MagneticButton>
              <Link
                href="/analyza"
                className="inline-flex items-center gap-2 px-8 py-4 bg-[#009EE2] font-semibold text-sm text-[#0B111F] hover:bg-[#1a9fdd] transition-colors"
              >
                Začít analýzu zdarma →
              </Link>
            </MagneticButton>
          </div>

          <div className="cta-card bg-[#F6F4EE]/[0.04] backdrop-blur-md border border-[#F6F4EE]/10 p-8">
            <h3 className="font-display text-[#F6F4EE] mb-1.5" style={{ fontSize: '1.25rem', letterSpacing: '-0.01em' }}>
              Přihlásit se do účtu
            </h3>
            <p className="text-[#F6F4EE]/50 text-sm mb-5">Zadejte e-mail a heslo</p>
            <InlineLogin />
          </div>
        </div>
      </div>
    </section>
  )
}
