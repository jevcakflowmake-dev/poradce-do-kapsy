import type { CSSProperties } from 'react'
import { PARTNERI } from '@/lib/partneri'

/**
 * Se kým spolupracuji – banky, pojišťovny a investiční společnosti. Hned pod
 * Kdo jsem, kde stojí, že nejsem vázaný na jednu pojišťovnu: loga jsou k té
 * větě doklad.
 *
 * Jednobarevně v navy. Barevná loga by se s paletou stránky tloukla a osmnáct
 * značek vedle sebe by působilo jako reklamní plocha. Soubory nesou jen tvar
 * (alfa kanál, viz scripts/partneri-loga.mts), barvu dává maska.
 *
 * Velikost podle plochy, ne podle šířky: široký nápis i čtvercový znak dostanou
 * stejnou plochu (--k na druhou), takže ani jeden nepřebíjí druhý.
 */
const maska = (url: string): CSSProperties => ({
  WebkitMask: `url(${url}) center / contain no-repeat`,
  mask: `url(${url}) center / contain no-repeat`,
})

export default function PartnersSection() {
  return (
    <section id="partneri" className="bg-cream pb-20 md:pb-28 scroll-mt-28">
      <div className="max-w-8xl mx-auto px-6 md:px-10 lg:px-16 xl:px-20">
        <h2 className="font-display text-h2 text-navy">Se kým spolupracuji</h2>
        <p className="text-lead text-slate mt-4 max-w-2xl text-pretty">
          Banky, pojišťovny a investiční společnosti, jejichž produkty vám můžu sjednat.
        </p>

        <ul className="mt-10 md:mt-14 grid grid-cols-3 md:grid-cols-6 gap-3 md:gap-5 [--k:2.5rem] md:[--k:3.25rem] lg:[--k:3.75rem]">
          {PARTNERI.map((p) => (
            <li
              key={p.nazev}
              className="flex h-16 md:h-24 items-center justify-center rounded-card border border-line bg-surface px-2 md:px-3"
            >
              {/* V režimu vysokého kontrastu by systém navy přebarvil na pozadí
                  a logo zmizelo – proto barva textu systému. */}
              <span
                role="img"
                aria-label={p.nazev}
                className="block w-[min(100%,calc(var(--s)*var(--k)))] bg-navy forced-color-adjust-none forced-colors:bg-[CanvasText]"
                style={
                  {
                    ...maska(p.logo),
                    aspectRatio: `${p.sirka} / ${p.vyska}`,
                    '--s': Math.sqrt(p.sirka / p.vyska).toFixed(3),
                  } as CSSProperties
                }
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
