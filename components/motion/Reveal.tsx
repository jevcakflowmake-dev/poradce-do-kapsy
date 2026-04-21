'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

type Props = {
  children: React.ReactNode
  className?: string
  as?: 'div' | 'section' | 'article' | 'ul' | 'ol'
  stagger?: number
  delay?: number
  selector?: string
  y?: number
  start?: string
}

export default function Reveal({
  children,
  className,
  as = 'div',
  stagger = 0.1,
  delay = 0,
  selector,
  y = 40,
  start = 'top 85%',
}: Props) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const targets = selector ? el.querySelectorAll<HTMLElement>(selector) : [el]
    if (!targets.length) return

    gsap.set(targets, { y, opacity: 0 })

    const ctx = gsap.context(() => {
      gsap.to(targets, {
        y: 0,
        opacity: 1,
        duration: 0.9,
        ease: 'power3.out',
        stagger,
        delay,
        scrollTrigger: { trigger: el, start },
      })
    }, el)

    return () => ctx.revert()
  }, [stagger, delay, selector, y, start])

  const Tag = as as React.ElementType
  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  )
}
