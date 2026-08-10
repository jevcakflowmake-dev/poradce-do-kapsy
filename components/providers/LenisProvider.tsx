'use client'

import { useEffect, useRef } from 'react'
import Lenis from 'lenis'
import { MotionConfig } from 'framer-motion'

/**
 * Plynulý scroll + globální nastavení animací.
 *
 * GSAP se na omezení animací ptá v každé komponentě zvlášť (viz lib/motion.ts),
 * Framer Motion to umí centrálně: `reducedMotion="user"` vypne transformace
 * a necháme jen opacitu, takže obsah nikde nezmizí.
 */
export default function LenisProvider({ children }: { children: React.ReactNode }) {
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.1,
    })

    const raf = (time: number) => {
      lenis.raf(time)
      rafRef.current = requestAnimationFrame(raf)
    }
    rafRef.current = requestAnimationFrame(raf)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      lenis.destroy()
    }
  }, [])

  return <MotionConfig reducedMotion="user">{children}</MotionConfig>
}
