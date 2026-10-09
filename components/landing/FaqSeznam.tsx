import type { ReactNode } from 'react'

export type Dotaz = {
  /** Název, pod kterým se rozbalení otázky ukáže v Google Analytics. */
  udalost: string
  otazka: string
  odpoved: ReactNode
}

/**
 * Accordion na nativním <details>. Žádný JavaScript: funguje klávesnicí,
 * dá se v něm hledat přes Ctrl+F a nezdrží první vykreslení.
 *
 * Společný pro úvodní stránku i stránky oblastí, ať se sazba nerozejde.
 * Rozbalení měří `components/mereni/Mereni.tsx` podle `data-mereni-otevreno`.
 */
export default function FaqSeznam({ dotazy }: { dotazy: readonly Dotaz[] }) {
  return (
    <div className="mt-10 md:mt-14 max-w-3xl divide-y divide-line border-y border-line">
      {dotazy.map((d) => (
        <details key={d.otazka} data-mereni-otevreno={d.udalost} className="group">
          <summary className="flex items-center justify-between gap-4 cursor-pointer list-none py-5 text-lead font-medium text-navy marker:hidden focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40 rounded-input">
            {d.otazka}
            <span
              aria-hidden
              className="shrink-0 w-8 h-8 rounded-pill border border-line flex items-center justify-center text-navy transition-transform group-open:rotate-45"
            >
              +
            </span>
          </summary>
          <p className="pb-6 pr-12 text-base text-slate text-pretty">{d.odpoved}</p>
        </details>
      ))}
    </div>
  )
}
