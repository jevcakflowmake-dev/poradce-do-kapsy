'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

export default function AdvisorListReveal({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ctx = gsap.context(() => {
      gsap.from('.advisor-hero > *', {
        y: 28,
        opacity: 0,
        duration: 0.7,
        ease: 'power3.out',
        stagger: 0.08,
      })
      gsap.from('.client-row', {
        y: 24,
        opacity: 0,
        duration: 0.55,
        ease: 'power3.out',
        stagger: 0.05,
        scrollTrigger: { trigger: '.client-table', start: 'top 90%' },
      })
    }, el)
    return () => ctx.revert()
  }, [])

  return <div ref={ref}>{children}</div>
}
