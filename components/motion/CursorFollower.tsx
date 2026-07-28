'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'

/**
 * Vlastní kurzor — azurová tečka + inkoustový prstenec s 0.15s zpožděním.
 * Jen pro jemné ukazatele (myš), na dotykových zařízeních se nevykreslí.
 * Nad odkazy a tlačítky se prstenec zvětší (třída .is-active).
 */
export default function CursorFollower() {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const dot = dotRef.current
    const ring = ringRef.current
    if (!dot || !ring) return
    if (!window.matchMedia('(pointer: fine)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    // quickTo — plynulé sledování bez zahlcení GSAP tickeru
    const dotX = gsap.quickTo(dot, 'x', { duration: 0.08, ease: 'power2.out' })
    const dotY = gsap.quickTo(dot, 'y', { duration: 0.08, ease: 'power2.out' })
    const ringX = gsap.quickTo(ring, 'x', { duration: 0.35, ease: 'power2.out' })
    const ringY = gsap.quickTo(ring, 'y', { duration: 0.35, ease: 'power2.out' })

    gsap.set([dot, ring], { xPercent: -50, yPercent: -50, opacity: 0 })

    const onMove = (e: MouseEvent) => {
      gsap.to([dot, ring], { opacity: 1, duration: 0.25, overwrite: 'auto' })
      dotX(e.clientX)
      dotY(e.clientY)
      ringX(e.clientX)
      ringY(e.clientY)
    }
    const onLeave = () => gsap.to([dot, ring], { opacity: 0, duration: 0.25 })

    // Interaktivní prvky zvětší prstenec
    const onOver = (e: MouseEvent) => {
      const t = e.target as HTMLElement
      ring.classList.toggle('is-active', !!t.closest('a, button, [role="button"], input, textarea, select, label'))
    }

    window.addEventListener('mousemove', onMove)
    document.documentElement.addEventListener('mouseleave', onLeave)
    window.addEventListener('mouseover', onOver)
    return () => {
      window.removeEventListener('mousemove', onMove)
      document.documentElement.removeEventListener('mouseleave', onLeave)
      window.removeEventListener('mouseover', onOver)
    }
  }, [])

  return (
    <>
      <div ref={dotRef} className="cursor-dot hidden md:block" aria-hidden />
      <div ref={ringRef} className="cursor-ring hidden md:block" aria-hidden />
    </>
  )
}
