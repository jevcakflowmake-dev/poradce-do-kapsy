'use client'

import { CreditCard } from 'lucide-react'
import { mesicniPlatby, type NavrhProPlatbu } from '@/lib/payments'
import LogoFirmy from '@/components/partneri/LogoFirmy'

/**
 * Přehled pravidelných plateb. Sdílený klientským dashboardem i poradcovým
 * náhledem – dřív byl kód na obou místech zvlášť, takže i výplň vymyšlených
 * platebních údajů se musela mazat dvakrát.
 */
export default function MesicniPlatby({
  navrhy,
  pohled,
}: {
  navrhy: NavrhProPlatbu[]
  pohled: 'klient' | 'poradce'
}) {
  const { platby, celkem } = mesicniPlatby(navrhy)

  return (
    <div
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-card bg-navy flex items-center justify-center">
          <CreditCard className="w-5 h-5 text-white" strokeWidth={1.8} />
        </div>
        <h2
          className="font-display text-navy text-h3"
        >
          Měsíční platby
        </h2>
      </div>

      {platby.length === 0 ? (
        <div className="bg-surface rounded-card border border-line p-8 text-center">
          <p className="text-base text-slate">
            {pohled === 'klient'
              ? 'Zatím tu nejsou žádné produkty s pravidelnou platbou.'
              : 'Klient zatím nemá žádný návrh s vyplněnou měsíční částkou.'}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {platby.map((platba) => (
              <div
                key={platba.id}
                className="bg-surface rounded-card border border-line p-5 md:p-6 hover:shadow-[0_10px_30px_-10px_rgba(15,42,68,0.08)] transition-all"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    {/* Na telefonu bez loga – vedle částky by na název nezbylo místo. */}
                    <LogoFirmy
                      firma={[platba.company, platba.title]}
                      nahrada={platba.logo}
                      className="hidden sm:flex"
                    />
                    <div className="min-w-0">
                      <h3
                        className="font-display text-navy truncate text-lead"
                      >
                        {platba.title}
                      </h3>
                      {platba.company && (
                        <span className="block text-base text-slate mt-0.5">{platba.company}</span>
                      )}
                    </div>
                  </div>
                  <span
                    className="font-display text-navy tabular-nums whitespace-nowrap text-h3"
                  >
                    {platba.monthly.toLocaleString('cs-CZ')} Kč
                    <span className="text-base text-slate"> / měsíc</span>
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
            <span className="text-[11px] tracking-[0.15em] uppercase text-slate">
              Celkem měsíčně
            </span>
            <span
              className="font-display text-navy tabular-nums text-h3"
            >
              {celkem.toLocaleString('cs-CZ')} Kč
            </span>
          </div>

          <p className="text-base text-slate mt-5 leading-relaxed">
            {pohled === 'klient'
              ? 'Údaje k úhradě — číslo účtu, variabilní symbol a termín splatnosti — najdete ve smlouvě od dané společnosti. Když si nebudete jistí, napište mi a projdeme to spolu.'
              : 'Údaje k úhradě (číslo účtu, VS, splatnost) aplikace neeviduje — klient je má ve smlouvě od společnosti.'}
          </p>
        </>
      )}
    </div>
  )
}
