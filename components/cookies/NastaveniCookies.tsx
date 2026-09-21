'use client'

import { MERENI_AKTIVNI, ulozSouhlas, zrusSouhlas } from '@/lib/souhlas'
import { useSouhlas, useVProhlizeci } from '@/lib/pouzijSouhlas'

const POPIS: Record<string, string> = {
  vse: 'Povolili jste i měření návštěvnosti.',
  'jen-nutne': 'Povolili jste jen cookies nutné pro přihlášení.',
}

/**
 * Ovládání souhlasu na stránce o cookies. Odvolat souhlas musí jít stejně
 * snadno jako ho dát, proto tu není schované pod odkazem, ale jako tlačítko.
 */
export default function NastaveniCookies() {
  const vProhlizeci = useVProhlizeci()
  const souhlas = useSouhlas()

  if (!vProhlizeci) return null

  if (!MERENI_AKTIVNI) {
    return (
      <p className="text-base text-slate leading-relaxed">
        Web zatím žádné měření nepoužívá, takže není co povolovat ani odvolávat.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-base text-slate leading-relaxed">
        {souhlas ? POPIS[souhlas.volba] : 'Zatím jste se nerozhodli.'}
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => ulozSouhlas('vse')}
          className="h-12 px-6 rounded-pill bg-mint text-base font-semibold text-navy transition-colors hover:bg-mint-dark focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40"
        >
          Povolit měření
        </button>
        <button
          type="button"
          onClick={() => ulozSouhlas('jen-nutne')}
          className="h-12 px-6 rounded-pill border border-line text-base font-semibold text-navy transition-colors hover:bg-cream-deep focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40"
        >
          Jen nutné cookies
        </button>
        {souhlas && (
          <button
            type="button"
            onClick={() => zrusSouhlas()}
            className="h-12 px-6 rounded-pill text-base font-medium text-slate underline underline-offset-4 transition-colors hover:text-navy focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40"
          >
            Zeptat se znovu
          </button>
        )}
      </div>
    </div>
  )
}
