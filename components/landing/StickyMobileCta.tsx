'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

/**
 * Na mobilu je hlavní CTA po prvním scrollu pryč a člověk se k němu musí
 * proscrollovat zpátky nebo až úplně dolů. Lišta ho drží po ruce celou dobu.
 *
 * Objeví se až po opuštění hero sekce, ať nekonkuruje hlavnímu tlačítku,
 * a na desktopu se nezobrazuje vůbec — tam je CTA v dohledu pořád.
 */
export default function StickyMobileCta() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    function onScroll() {
      // Zhruba za prvním viewportem; nižší práh by lištu ukázal přes hero.
      setVisible(window.scrollY > window.innerHeight * 0.9)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div
      className={`md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-[#F6F4EE]/12 bg-[#0B111F]/95 backdrop-blur-md px-4 py-3 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
      // Skryté liště nesmí zůstat fokusovatelný odkaz — jinak by ho
      // klávesnice a čtečky našly dřív, než se vůbec objeví.
      aria-hidden={!visible}
      inert={!visible}
    >
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[#F6F4EE] text-sm font-semibold leading-tight">
            Finanční plán zdarma
          </p>
          <p className="text-[#F6F4EE]/45 text-xs leading-tight mt-0.5">
            10 minut · bez registrace
          </p>
        </div>
        <Link
          href="/analyza"
          className="inline-flex items-center gap-1.5 px-5 py-3 bg-[#009EE2] font-semibold text-sm text-[#0B111F] shrink-0"
        >
          Začít
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}
