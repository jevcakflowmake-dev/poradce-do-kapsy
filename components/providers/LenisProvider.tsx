'use client'

import { useEffect } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { MotionConfig } from 'framer-motion'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

/**
 * Plynulý scroll + globální nastavení animací.
 *
 * Lenis a ScrollTrigger musí běžet na jednom taktu. Dřív měl Lenis vlastní
 * requestAnimationFrame smyčku a ScrollTrigger si pozici scrollu četl sám,
 * takže scrubované animace (čára v cestě životem) dostávaly pozici o snímek
 * pozdě a sekaly se. Teď Lenis pohání `gsap.ticker` a každý svůj posun hned
 * hlásí ScrollTriggeru.
 *
 * GSAP se na omezení animací ptá v každé komponentě zvlášť (viz lib/motion.ts),
 * Framer Motion to umí centrálně: `reducedMotion="user"` vypne transformace
 * a necháme jen opacitu, takže obsah nikde nezmizí.
 */
export default function LenisProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Pozice triggerů se počítají při mountu, jenže výšku stránky nad nimi
    // ještě mění dočítané fonty a obrázky. Bez přepočtu by animace začínaly
    // a končily na starých souřadnicích.
    const refresh = () => ScrollTrigger.refresh()
    window.addEventListener('load', refresh)
    document.fonts?.ready.then(refresh)

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) {
      return () => window.removeEventListener('load', refresh)
    }

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.1,
    })

    lenis.on('scroll', ScrollTrigger.update)
    const tick = (time: number) => lenis.raf(time * 1000) // ticker běží v sekundách
    gsap.ticker.add(tick)
    // Bez tohohle GSAP po zadrhnutí prohlížeče dohání čas skokem a scrub poskočí.
    gsap.ticker.lagSmoothing(0)

    return () => {
      window.removeEventListener('load', refresh)
      gsap.ticker.remove(tick)
      gsap.ticker.lagSmoothing(500, 33) // výchozí hodnoty GSAP
      lenis.destroy()
    }
  }, [])

  return <MotionConfig reducedMotion="user">{children}</MotionConfig>
}
