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

/**
 * „Co přesně dostanete“ – na webu dosud chybělo. Návštěvník slyšel, že
 * dostane „finanční plán“, ale nevěděl, co to znamená; abstraktní slib
 * se špatně směňuje za deset minut vyplňování. Tahle sekce pojmenovává
 * konkrétní výstup, aby bylo vidět, co za ten čas dostane zpátky.
 *
 * Popisy odpovídají tomu, co aplikace opravdu umí (plan_variants, graf
 * výpadku příjmu, PDF návrhy, chat) – nic tu není naslibované dopředu.
 */
const ITEMS = [
  {
    num: '01',
    title: 'Mapu vašich děr',
    desc: 'Šest oblastí – příjem, bydlení, majetek, děti, investice, penze – a u každé barevně, jestli je v pořádku, nebo se v ní schovává problém.',
  },
  {
    num: '02',
    title: 'Tři konkrétní varianty',
    desc: 'Ne „doporučuji pojištění“, ale tři nabídky od jmenovitých společností vedle sebe, s měsíční částkou a rozsahem krytí. Vyberete si sami.',
  },
  {
    num: '03',
    title: 'Graf, co se stane při výpadku příjmu',
    desc: 'Uvidíte, kolik vám zbude, když onemocníte nebo se zraníte – a o kolik z toho vás pojistka dorovná. Bez toho jsou čísla jen čísla.',
  },
  {
    num: '04',
    title: 'Poradce v aplikaci',
    desc: 'Chat, kde se doptáte na cokoliv, a všechny dokumenty na jednom místě. Žádné hledání v e-mailech půl roku zpátky.',
  },
]

export default function DeliverableSection() {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (prefersReducedMotion()) return

    const ctx = gsap.context(() => {
      gsap.from('.deliverable-head > *', {
        y: 30,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
        stagger: 0.08,
        scrollTrigger: { trigger: el, start: 'top 82%' },
      })
      gsap.from('.deliverable-item', {
        y: 40,
        opacity: 0,
        duration: 0.85,
        ease: 'power3.out',
        stagger: 0.1,
        scrollTrigger: { trigger: '.deliverable-grid', start: 'top 85%' },
      })
    }, el)
    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={ref}
      id="co-dostanete"
      className="relative px-6 md:px-10 lg:px-16 xl:px-20 py-24 md:py-32 bg-[#0B111F] overflow-hidden"
    >
      <div className="noise-overlay" aria-hidden />
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(800px circle at 15% 20%, rgba(0,158,226,0.10), transparent 55%)',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="deliverable-head grid grid-cols-12 gap-6 items-end mb-14">
          <div className="col-span-12 md:col-span-8">
            <div className="section-numeral-dark text-[3.5rem] md:text-[5rem] mb-3">04</div>
            <p className="text-xs tracking-[0.3em] uppercase text-[#66708C] mb-3">
              Výstup · za deset minut vyplňování
            </p>
            <h2
              className="font-display text-[#F6F4EE]"
              style={{ fontSize: 'clamp(2rem, 4.5vw, 3.5rem)', letterSpacing: '-0.025em', lineHeight: 1.03 }}
            >
              Co vám <span style={{ color: '#009EE2' }}>doopravdy</span> přijde
            </h2>
          </div>
          <p className="col-span-12 md:col-span-4 text-[#F6F4EE]/50 text-sm md:text-base leading-relaxed md:text-right md:pb-2">
            Ne PDF leták s obecnými radami. Čtyři věci, které si otevřete
            v prohlížeči a rozumíte jim i bez poradce po ruce.
          </p>
        </div>

        <div className="deliverable-grid grid grid-cols-1 md:grid-cols-2 border-t border-[#F6F4EE]/12">
          {ITEMS.map((item, i) => (
            <article
              key={item.num}
              className={`deliverable-item group relative py-8 md:py-10 border-b border-[#F6F4EE]/12 ${
                i % 2 === 1 ? 'md:pl-12 md:border-l md:border-l-[#F6F4EE]/12' : 'md:pr-12'
              }`}
            >
              <div className="flex items-baseline gap-4 mb-3">
                <span
                  className="font-display text-[#009EE2]/70"
                  style={{ fontSize: '1.1rem' }}
                >
                  {item.num}
                </span>
                <h3
                  className="font-display text-[#F6F4EE]"
                  style={{ fontSize: 'clamp(1.3rem, 2.2vw, 1.75rem)', letterSpacing: '-0.015em', lineHeight: 1.15 }}
                >
                  {item.title}
                </h3>
              </div>
              <p className="text-[#F6F4EE]/55 leading-relaxed md:pl-10 max-w-lg">
                {item.desc}
              </p>
              <div className="absolute bottom-[-1px] left-0 h-px w-0 bg-[#009EE2] group-hover:w-full transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]" />
            </article>
          ))}
        </div>

        <div className="mt-12 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <Link
              href="/analyza"
              className="group inline-flex items-center gap-2 px-8 py-4 bg-[#009EE2] font-semibold text-sm text-[#0B111F] hover:bg-[#1a9fdd] transition-colors"
            >
              Chci to taky
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          <p className="text-sm text-[#F6F4EE]/40">
            Zdarma · Bez registrace · Nezávazně
          </p>
        </div>
      </div>
    </section>
  )
}
