/**
 * Tři kroky procesu. Číslo nese navy kolečko — amber je vyhrazený na jedno
 * číslo na obrazovku a na krémovém pozadí by stejně neprošel kontrastem.
 */
const KROKY = [
  {
    titul: 'Vyplníte online dotazník.',
    popis: 'Patnáct minut, kdykoliv, i večer po uložení dětí.',
  },
  {
    titul: 'Připravím návrh na míru.',
    popis: 'Do 48 hodin, s vysvětlením, proč zrovna takhle.',
  },
  {
    titul: 'Vše máte v aplikaci.',
    popis: 'Smlouvy, přehled i chat se mnou. Bez šanonu.',
  },
]

export default function HowItWorksSection() {
  return (
    <section id="jak-to-funguje" className="bg-cream pb-20 md:pb-28 scroll-mt-28">
      <div className="max-w-8xl mx-auto px-6 md:px-10 lg:px-16 xl:px-20">
        <h2 className="font-display text-h2 text-navy">Jak to funguje</h2>

        <ol className="mt-10 md:mt-14 grid gap-5 md:grid-cols-3">
          {KROKY.map((krok, i) => (
            <li
              key={krok.titul}
              className="rounded-card border border-line bg-surface shadow-card p-7 md:p-8"
            >
              <span
                aria-hidden
                className="inline-flex items-center justify-center w-11 h-11 rounded-pill bg-navy text-cream font-display text-lg"
              >
                {i + 1}
              </span>
              <h3 className="font-display text-h3 text-navy mt-5">{krok.titul}</h3>
              <p className="text-base text-slate mt-2 text-pretty">{krok.popis}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
