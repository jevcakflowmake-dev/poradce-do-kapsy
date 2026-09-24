import { PARTNERI } from '@/lib/partneri'
import { ZnakPartnera } from '@/components/partneri/LogoFirmy'

/**
 * S kým spolupracuji – banky, pojišťovny a investiční společnosti. Hned pod
 * Kdo jsem, kde stojí, že nejsem vázaný na jednu pojišťovnu: loga jsou k té
 * větě doklad.
 *
 * Jednobarevně v navy. Barevná loga by se s paletou stránky tloukla a osmnáct
 * značek vedle sebe by působilo jako reklamní plocha. Stejné značky jsou
 * u variant plánu a u smluv klienta (ZnakPartnera).
 */

export default function PartnersSection() {
  return (
    <section id="partneri" className="bg-cream pb-20 md:pb-28 scroll-mt-28">
      <div className="max-w-8xl mx-auto px-6 md:px-10 lg:px-16 xl:px-20">
        <h2 className="font-display text-h2 text-navy">S kým spolupracuji</h2>
        <p className="text-lead text-slate mt-4 max-w-2xl text-pretty">
          Banky, pojišťovny a investiční společnosti, jejichž produkty vám můžu sjednat.
        </p>

        <ul className="mt-10 md:mt-14 grid grid-cols-3 md:grid-cols-6 gap-3 md:gap-5 [--k:2.5rem] md:[--k:3.25rem] lg:[--k:3.75rem]">
          {PARTNERI.map((p) => (
            <li
              key={p.nazev}
              className="flex h-16 md:h-24 items-center justify-center rounded-card border border-line bg-surface px-2 md:px-3"
            >
              <ZnakPartnera partner={p} popisek />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
