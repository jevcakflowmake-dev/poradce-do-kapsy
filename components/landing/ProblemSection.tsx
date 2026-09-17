/**
 * Tři věty, ve kterých se má člověk poznat. Bez ikon a bez ozdob —
 * hierarchii nese velikost písma a bílá plocha karty na krémovém pozadí.
 */
const OTAZKY = [
  'Máte tři pojistky a nevíte, co která kryje.',
  'Na schůzku s poradcem nemáte čas ani chuť.',
  'Peníze leží na účtu a inflace je ujídá.',
]

export default function ProblemSection() {
  return (
    <section className="bg-cream py-20 md:py-28">
      <div className="max-w-8xl mx-auto px-6 md:px-10 lg:px-16 xl:px-20">
        <h2 className="font-display text-h2 text-navy">Poznáváte se?</h2>

        <ul className="mt-10 md:mt-14 grid gap-5 md:grid-cols-3">
          {OTAZKY.map((text) => (
            <li
              key={text}
              className="rounded-card border border-line bg-surface shadow-card p-7 md:p-8"
            >
              <p className="text-lead text-navy text-pretty">{text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
