import Link from 'next/link'

/**
 * Accordion na nativním <details>. Žádný JavaScript: funguje klávesnicí,
 * dá se v něm hledat přes Ctrl+F a nezdrží první vykreslení.
 */
const DOTAZY = [
  {
    otazka: 'Je to opravdu zdarma?',
    odpoved: (
      <>
        Ano. Za analýzu ani za návrh neplatíte nic. Jsem placený provizí od instituce, se
        kterou nakonec smlouvu uzavřete, a provize je součástí ceny produktu – vyjde vás stejně,
        ať smlouvu sjednáte přese mě, nebo přímo na pobočce.
      </>
    ),
  },
  {
    otazka: 'Musím něco podepsat?',
    odpoved: (
      <>
        Ne. Vyplnění analýzy vás k ničemu nezavazuje. Podepisujete až konkrétní smlouvu,
        kterou si sami vyberete, a na rozmyšlenou máte tolik času, kolik potřebujete.
      </>
    ),
  },
  {
    otazka: 'Budete mi volat?',
    odpoved: (
      <>
        Ne, pokud si to sami nevyžádáte. Telefon je v dotazníku nepovinný. Ozvu se e-mailem
        a dál si píšeme v aplikaci.
      </>
    ),
  },
  {
    otazka: 'Co se stane s mými daty?',
    odpoved: (
      <>
        Zůstávají v databázi v Evropské unii a vidí je jen váš poradce. Nepředávám je
        nikomu dalšímu ani je nepoužívám k reklamě. Podrobnosti popisují{' '}
        <Link
          href="/zasady-ochrany-osobnich-udaju"
          className="text-navy underline underline-offset-4 hover:text-mint-dark rounded-pill focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40"
        >
          zásady ochrany osobních údajů
        </Link>
        .
      </>
    ),
  },
  {
    otazka: 'Jak dlouho to trvá?',
    odpoved: (
      <>
        Analýza zabere kolem patnácti minut a nemusíte ji vyplnit najednou – rozepsané
        odpovědi se průběžně ukládají a můžete se k nim vrátit. Návrh připravím do 48 hodin.
      </>
    ),
  },
]

export default function FaqSection() {
  return (
    <section id="caste-dotazy" className="bg-cream py-20 md:py-28 scroll-mt-28">
      <div className="max-w-8xl mx-auto px-6 md:px-10 lg:px-16 xl:px-20">
        <h2 className="font-display text-h2 text-navy">Časté dotazy</h2>

        <div className="mt-10 md:mt-14 max-w-3xl divide-y divide-line border-y border-line">
          {DOTAZY.map((d) => (
            <details key={d.otazka} className="group">
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
      </div>
    </section>
  )
}
