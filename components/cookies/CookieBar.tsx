'use client'

import Link from 'next/link'
import { MERENI_AKTIVNI, ulozSouhlas, type Volba } from '@/lib/souhlas'
import { useSouhlas, useVProhlizeci } from '@/lib/pouzijSouhlas'

/**
 * Lišta souhlasu s cookies.
 *
 * Není modální: nic nepřekrývá a nedrží fokus. Obě volby jsou rovnocenná
 * tlačítka, odmítnout jde stejně snadno jako přijmout.
 */
export default function CookieBar() {
  const vProhlizeci = useVProhlizeci()
  const souhlas = useSouhlas()

  if (!MERENI_AKTIVNI || !vProhlizeci || souhlas) return null

  function rozhodni(volba: Volba) {
    ulozSouhlas(volba)
  }

  return (
    <div
      role="region"
      aria-label="Souhlas s cookies"
      className="fixed inset-x-0 bottom-0 z-50 bg-navy border-t border-cream/15 px-6 py-4 md:px-10 md:py-5 pb-[max(1rem,env(safe-area-inset-bottom))]"
    >
      <div className="max-w-5xl mx-auto flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <p className="text-base text-cream/85 leading-relaxed max-w-2xl text-pretty">
          Kromě cookies nutných pro přihlášení bychom rádi měřili návštěvnost. Bez
          souhlasu měřicí skripty nenačítáme.{' '}
          <Link
            href="/zasady-cookies"
            className="text-cream underline underline-offset-4 hover:text-mint rounded-pill focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40"
          >
            Co se ukládá
          </Link>
        </p>

        <div className="flex gap-3 items-center shrink-0">
          <button
            type="button"
            onClick={() => rozhodni('jen-nutne')}
            className="h-12 px-6 flex-1 md:flex-none rounded-pill border border-cream/40 text-base font-semibold text-cream transition-colors hover:bg-cream/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40"
          >
            Jen nutné
          </button>
          <button
            type="button"
            onClick={() => rozhodni('vse')}
            className="h-12 px-6 flex-1 md:flex-none rounded-pill bg-mint text-base font-semibold text-navy transition-colors hover:bg-mint-dark focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40"
          >
            Přijmout vše
          </button>
        </div>
      </div>
    </div>
  )
}
