'use client'

import { MotionConfig } from 'framer-motion'

/**
 * Jediné globální nastavení animací: `reducedMotion="user"` respektuje
 * systémové omezení pohybu a nechá běžet jen opacitu, takže obsah nikde
 * nezmizí. Plynulý scroll (Lenis) ani scrollová choreografie (GSAP) tu
 * nejsou schválně – nový vzhled stojí na sazbě, ne na pohybu.
 */
export default function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>
}
