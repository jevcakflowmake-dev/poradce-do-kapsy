'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { MERENI_AKTIVNI, ulozSouhlas, type Volba } from '@/lib/souhlas'
import { useSouhlas, useVProhlizeci } from '@/lib/pouzijSouhlas'

/**
 * Lišta souhlasu s cookies.
 *
 * Není modální: nedrží fokus a obě volby jsou rovnocenná tlačítka, odmítnout
 * jde stejně snadno jako přijmout.
 *
 * Plovoucí karta místo pruhu přes celou šířku: na mobilu dřív zabírala čtvrtinu
 * obrazovky a na úvodu analýzy zakrývala odpovědi. Na desktopu sedí v pravém
 * dolním rohu mimo hlavní text. Dokud je vidět, dostane `body` spodní odsazení
 * podle její výšky, takže se dá doscrollovat ke všemu, co by jinak zakryla
 * (patička, tlačítko Další v analýze).
 */
export default function CookieBar() {
  const vProhlizeci = useVProhlizeci()
  const souhlas = useSouhlas()
  const ref = useRef<HTMLDivElement>(null)
  const viditelna = MERENI_AKTIVNI && vProhlizeci && !souhlas

  useEffect(() => {
    const el = ref.current
    if (!viditelna || !el) return
    const body = document.body
    const puvodni = body.style.paddingBottom
    const pozoruj = new ResizeObserver(() => {
      // výška karty + mezera pod ní (bottom-3 / md:bottom-6)
      const mezera = window.matchMedia('(min-width: 768px)').matches ? 24 : 12
      body.style.paddingBottom = `${el.offsetHeight + mezera * 2}px`
    })
    pozoruj.observe(el)
    return () => {
      pozoruj.disconnect()
      body.style.paddingBottom = puvodni
    }
  }, [viditelna])

  if (!viditelna) return null

  function rozhodni(volba: Volba) {
    ulozSouhlas(volba)
  }

  return (
    <div
      ref={ref}
      role="region"
      aria-label="Souhlas s cookies"
      className="fixed z-50 inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] md:inset-x-auto md:right-6 md:bottom-6 md:max-w-sm rounded-card bg-navy border border-cream/15 shadow-lg p-4"
    >
      <p className="text-sm text-cream/85 leading-snug text-pretty">
        Rádi bychom měřili návštěvnost. Bez souhlasu měřicí skripty nenačítáme.{' '}
        <Link
          href="/zasady-cookies"
          className="text-cream underline underline-offset-4 hover:text-mint rounded-pill focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40"
        >
          Co se ukládá
        </Link>
      </p>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => rozhodni('jen-nutne')}
          className="h-11 px-4 flex-1 rounded-pill border border-cream/40 text-sm font-semibold text-cream transition-colors hover:bg-cream/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40"
        >
          Jen nutné
        </button>
        <button
          type="button"
          onClick={() => rozhodni('vse')}
          className="h-11 px-4 flex-1 rounded-pill bg-mint text-sm font-semibold text-navy transition-colors hover:bg-mint-dark focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40"
        >
          Přijmout vše
        </button>
      </div>
    </div>
  )
}
