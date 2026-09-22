import { PREDPOKLADY, type VysledekDuchod } from '@/lib/duchod'

/**
 * „Důchod v číslech" — převzato ze starého papírového plánu (ProfiFP/OVB):
 * požadovaná renta v dnešních i budoucích cenách, odhad státního důchodu
 * a z rozdílu měsíční úložka.
 *
 * Předpoklady výpočtu jsou vypsané pod čísly schválně. Bez nich je to jen
 * velké číslo, u kterého klient neví, odkud se vzalo, a poradce nepozná,
 * kdy pro jeho případ nesedí.
 */

const kc = (n: number) => n.toLocaleString('cs-CZ', { maximumFractionDigits: 0 }) + ' Kč'
const procento = (n: number) => Math.round(n * 100) + ' %'

export default function DuchodVCislech({ v }: { v: VysledekDuchod }) {
  const podilStatu = v.budouci.renta > 0 ? v.budouci.stat / v.budouci.renta : 0
  const rozdilOdUlozky = v.mesicneOdkladat - v.odkladaTed
  const popisekStatu = v.zdrojStatu === 'poradce' ? 'Důchod od státu' : 'Odhad od státu'

  return (
    <section className="rounded-card border border-line bg-cream p-5 md:p-6" aria-labelledby="duchod-v-cislech">
      <h4 id="duchod-v-cislech" className="font-display text-h3 text-navy">
        Kolik na to potřebujete
      </h4>
      <p className="text-base text-slate mt-2 text-pretty">
        Za {v.roky} let přestáváte pracovat a renta má vydržet {PREDPOKLADY.letVDuchodu} let.
      </p>

      {/* Dva sloupce až od md – na 640 px byly tak úzké, že se „30 000 Kč“ lámalo na dva řádky. */}
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Sloupec
          titul="V dnešních cenách"
          radky={[
            ['Chcete měsíčně', kc(v.dnes.renta)],
            [popisekStatu, kc(v.dnes.stat)],
            ['Zbývá dorovnat', kc(v.dnes.mezera)],
          ]}
          celkem={['Celkem připravit', kc(v.dnes.celkem)]}
        />
        <Sloupec
          titul="V cenách, které budou"
          radky={[
            ['Chcete měsíčně', kc(v.budouci.renta)],
            [popisekStatu, kc(v.budouci.stat)],
            ['Zbývá dorovnat', kc(v.budouci.mezera)],
          ]}
          celkem={['Celkem připravit', kc(v.budouci.celkem)]}
          zvyraznit
        />
      </div>

      {/* Poměr stát / vlastní příprava. Pruh nese informaci, proto má i popisky. */}
      <div className="mt-6">
        <div className="flex h-3 rounded-pill overflow-hidden border border-line" role="presentation">
          <div className="bg-navy-soft" style={{ width: `${Math.round(podilStatu * 100)}%` }} />
          <div className="bg-mint flex-1" />
        </div>
        <p className="text-base text-slate mt-2 text-pretty">
          Zhruba {procento(podilStatu)} renty pokryje stát, zbytek je na vás.
        </p>
      </div>

      {v.zNaspořeného > 0 && (
        <p className="text-base text-navy mt-5 text-pretty">
          Co už máte odložené, z toho do té doby naroste přibližně{' '}
          <strong>{kc(v.zNaspořeného)}</strong>. Doplnit zbývá {kc(v.chybi)}.
        </p>
      )}

      <div className="mt-5 rounded-card bg-navy text-cream p-5">
        <p className="text-base text-cream/70">Abyste na to došli, je potřeba odkládat</p>
        <p className="font-display text-h2 text-cream mt-1">{kc(v.mesicneOdkladat)} měsíčně</p>
        {v.odkladaTed > 0 && (
          <p className="text-base text-cream/70 mt-2 text-pretty">
            Teď odkládáte {kc(v.odkladaTed)}.{' '}
            {rozdilOdUlozky > 0
              ? `Chybí tedy ${kc(rozdilOdUlozky)} měsíčně.`
              : 'Na tenhle cíl to stačí.'}
          </p>
        )}
      </div>

      <p className="text-base text-slate mt-4 text-pretty">
        Počítáno s inflací {procento(PREDPOKLADY.inflace)} ročně a zhodnocením{' '}
        {procento(PREDPOKLADY.zhodnoceni)} ročně.{' '}
        {v.zdrojStatu === 'poradce'
          ? 'Výši státního důchodu spočítal poradce podle vašich odpracovaných let.'
          : `Státní důchod je hrubý odhad ve výši ${procento(PREDPOKLADY.nahradovyPomer)} vašeho dnešního čistého příjmu — skutečná výše závisí na odpracovaných letech.`}{' '}
        Jsou to předpoklady výpočtu, ne zaručený výnos ani příslib státu.
      </p>
    </section>
  )
}

function Sloupec({
  titul,
  radky,
  celkem,
  zvyraznit = false,
}: {
  titul: string
  radky: Array<[string, string]>
  celkem: [string, string]
  zvyraznit?: boolean
}) {
  return (
    <div className={`rounded-card border p-4 ${zvyraznit ? 'border-mint bg-surface' : 'border-line bg-surface'}`}>
      <h5 className="text-base font-semibold text-navy">{titul}</h5>
      <dl className="mt-3 space-y-1.5">
        {radky.map(([k, val]) => (
          <div key={k} className="flex items-baseline justify-between gap-3">
            <dt className="text-sm text-slate">{k}</dt>
            {/* Částka se nesmí zlomit mezi číslo a „Kč“. */}
            <dd className="text-base text-navy tabular-nums whitespace-nowrap">{val}</dd>
          </div>
        ))}
      </dl>
      <div className="h-px bg-line my-3" />
      {/* Souhrn pod sebe – „Celkem připravit 2 592 000 Kč“ se na jeden řádek nevejde. */}
      <div>
        <span className="block text-sm text-slate">{celkem[0]}</span>
        <span className="block font-display text-navy tabular-nums whitespace-nowrap mt-0.5">
          {celkem[1]}
        </span>
      </div>
    </div>
  )
}
