'use client'

import { motion } from 'framer-motion'
import { CreditCard } from 'lucide-react'
import { mesicniPlatby, type NavrhProPlatbu } from '@/lib/payments'

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-none bg-[#162459] flex items-center justify-center">
          <CreditCard className="w-5 h-5 text-white" strokeWidth={1.8} />
        </div>
        <h2
          className="font-display text-[#162459]"
          style={{ fontSize: '1.25rem', letterSpacing: '-0.01em' }}
        >
          Měsíční <span style={{ color: '#009EE2' }}>platby</span>
        </h2>
      </div>

      {platby.length === 0 ? (
        <div className="bg-[#FDFCF8] rounded-none border border-[#E4DFD2] p-8 text-center">
          <p className="text-sm text-[#66708C]">
            {pohled === 'klient'
              ? 'Zatím tu nejsou žádné produkty s pravidelnou platbou.'
              : 'Klient zatím nemá žádný návrh s vyplněnou měsíční částkou.'}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {platby.map((platba, idx) => (
              <motion.div
                key={platba.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 + idx * 0.08 }}
                className="bg-[#FDFCF8] rounded-none border border-[#E4DFD2] p-5 md:p-6 hover:shadow-[0_10px_30px_-10px_rgba(22,36,89,0.08)] transition-all"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <h3
                      className="font-display text-[#162459] truncate"
                      style={{ fontSize: '1rem', letterSpacing: '-0.01em' }}
                    >
                      {platba.title}
                    </h3>
                    {platba.company && (
                      <span className="text-sm text-[#66708C] mt-0.5 flex items-center gap-1.5">
                        {platba.logo && <span>{platba.logo}</span>}
                        {platba.company}
                      </span>
                    )}
                  </div>
                  <span
                    className="font-display text-[#0079AD] tabular-nums whitespace-nowrap"
                    style={{ fontSize: '1.15rem' }}
                  >
                    {platba.monthly.toLocaleString('cs-CZ')} Kč
                    <span className="text-sm text-[#66708C]"> / měsíc</span>
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-[#E4DFD2] pt-4">
            <span className="text-[11px] tracking-[0.15em] uppercase text-[#66708C]">
              Celkem měsíčně
            </span>
            <span
              className="font-display text-[#162459] tabular-nums"
              style={{ fontSize: '1.25rem' }}
            >
              {celkem.toLocaleString('cs-CZ')} Kč
            </span>
          </div>

          <p className="text-sm text-[#66708C] mt-5 leading-relaxed">
            {pohled === 'klient'
              ? 'Údaje k úhradě — číslo účtu, variabilní symbol a termín splatnosti — najdete ve smlouvě od dané společnosti. Když si nebudete jistí, napište mi a projdeme to spolu.'
              : 'Údaje k úhradě (číslo účtu, VS, splatnost) aplikace neeviduje — klient je má ve smlouvě od společnosti.'}
          </p>
        </>
      )}
    </motion.div>
  )
}
