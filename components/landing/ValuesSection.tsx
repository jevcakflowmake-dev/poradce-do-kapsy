/**
 * Čtyři pilíře služby. Nápad ze srovnávacího návrhu (Google Pomelli), ale
 * v naší řeči: nadpis vlevo jako u ostatních sekcí, žádné eyebrow popisky
 * ani vycentrovaný blok, a čísla 01–04 vynechaná — o dvě sekce výš už
 * číslujeme kroky a druhá číselná řada by si s nimi konkurovala.
 *
 * Bílý podklad je tu jediný na stránce: rozbíjí dlouhý krémový úsek mezi
 * hero a ceníkem. Karty jsou proto obráceně — krémové na bílé.
 *
 * Mátová hrana je dekorace, ne nositel informace: máta na světlém podkladu
 * má kontrast 2,6:1, takže by v ní text ani ikona projít nemohly.
 *
 * TODO (Jakub): „Porovnání" je schválně opatrnější než „Nezávislost"
 * z návrhu — jako vázaný zástupce placený provizí nemůžeš nabízet
 * nezávislé poradenství ve smyslu zákona. Až si ověříš, co smíš tvrdit,
 * dá se titulek přepsat; text pod ním sedí s odstavcem v sekci Kdo jsem.
 */
const HODNOTY = [
  {
    titul: 'Transparentnost',
    popis: 'U každého doporučení napíšu, proč zrovna tohle a kolik za to dostanu zaplaceno.',
  },
  {
    titul: 'Dostupnost',
    popis: 'Smlouvy, přehled i chat se mnou máte v mobilu. Bez dojíždění a bez šanonu.',
  },
  {
    titul: 'Porovnání',
    popis: 'Nejsem vázaný na jednu pojišťovnu, takže nabídky porovnám mezi sebou.',
  },
  {
    titul: 'Flexibilita',
    popis: 'Návrh máte do 48 hodin. Na schůzku se stavím, když o ni budete stát.',
  },
]

export default function ValuesSection() {
  return (
    <section id="hodnoty" className="bg-surface py-20 md:py-28 scroll-mt-28">
      <div className="max-w-8xl mx-auto px-6 md:px-10 lg:px-16 xl:px-20">
        <h2 className="font-display text-h2 text-navy">Čeho se držím</h2>
        <p className="text-lead text-slate mt-4 max-w-2xl text-pretty">
          Čtyři věci, na kterých mi u téhle práce záleží.
        </p>

        <ul className="mt-10 md:mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {HODNOTY.map((h) => (
            <li
              key={h.titul}
              className="rounded-card border border-line border-l-4 border-l-mint bg-cream p-7 md:p-8"
            >
              <h3 className="font-display text-h3 text-navy">{h.titul}</h3>
              <p className="text-base text-slate mt-3 text-pretty">{h.popis}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
