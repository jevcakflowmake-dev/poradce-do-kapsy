import { PORADCE } from '@/lib/poradce'
import { formatDate } from '@/lib/utils'

/**
 * Titulka a závěr tiskové podoby finančního plánu. Na obrazovce se
 * nevykreslují (`jen-tisk`) — tam hlavičku nese `<header>` stránky a
 * kontakt je v chatu.
 *
 * Inspirace ze staršího papírového plánu (ProfiFP/OVB): dokument, který
 * si klient uloží nebo vytiskne, má mít první stranu se jménem a datem a
 * poslední stranu s tím, co ten dokument vlastně je a na koho se obrátit.
 *
 * Titulka je schválně světlá. Celostránková navy plocha vypadá na
 * obrazovce dobře, ale na papíře spotřebuje toner a při tisku do PDF
 * ztěžuje čtení na e-ink čtečkách.
 */

export function TiskovaTitulka({ jmenoKlienta, datum }: { jmenoKlienta: string | null; datum: string | null }) {
  return (
    <div className="jen-tisk tisk-nova-strana-po">
      <div className="border-t-4 border-mint pt-8">
        <p className="text-base text-slate uppercase tracking-[0.18em]">Finanční plán</p>
        <h1 className="font-display text-display text-navy mt-6 text-balance">
          {jmenoKlienta ?? 'Váš finanční plán'}
        </h1>
        <dl className="mt-10 space-y-2">
          <Radek popisek="Připravil" hodnota={PORADCE.jmeno} />
          {datum && <Radek popisek="Datum" hodnota={formatDate(datum)} />}
          {PORADCE.email && <Radek popisek="Kontakt" hodnota={PORADCE.email} />}
        </dl>
      </div>
    </div>
  )
}

export function TiskovyZaver({ datum }: { datum: string | null }) {
  return (
    <div className="jen-tisk tisk-nova-strana-pred">
      <div className="border-t-4 border-mint pt-8">
        <h2 className="font-display text-h2 text-navy">K tomuhle dokumentu</h2>

        <div className="mt-6 space-y-4 text-lead text-navy max-w-2xl text-pretty">
          <p>
            Je to shrnutí návrhu, který jsem pro vás připravil
            {datum ? ` k ${formatDate(datum)}` : ''}. Není to smlouva ani závazná nabídka –
            konečné podmínky, ceny a rozsah krytí určuje vybraná finanční instituce ve smluvní
            dokumentaci, kterou dostanete před podpisem.
          </p>
          <p>
            Měsíční částky jsou orientační podle sazeb platných v době přípravy návrhu. Výpočty
            pracují s předpoklady, které jsou vypsané přímo u nich – nejsou to zaručené výnosy
            ani přísliby státu.
          </p>
          <p>
            Kdykoliv se na cokoliv z plánu zeptejte. Odpovím v aplikaci nebo e-mailem.
          </p>
        </div>

        <div className="mt-10 pt-6 border-t border-line">
          <p className="font-display text-h3 text-navy">{PORADCE.jmeno}</p>
          <dl className="mt-3 space-y-1.5">
            <Radek popisek="E-mail" hodnota={PORADCE.email} />
            <Radek popisek="IČO" hodnota={PORADCE.ico} />
            <Radek popisek="Sídlo" hodnota={PORADCE.adresa} />
            {/* Dokud číslo registrace není vyplněné, řádek se nevykreslí. */}
            {PORADCE.cnbCisloRegistrace && (
              <Radek popisek="Registrace ČNB" hodnota={PORADCE.cnbCisloRegistrace} />
            )}
          </dl>
        </div>
      </div>
    </div>
  )
}

function Radek({ popisek, hodnota }: { popisek: string; hodnota: string }) {
  return (
    <div className="flex gap-3">
      <dt className="text-base text-slate w-32 shrink-0">{popisek}</dt>
      <dd className="text-base text-navy">{hodnota}</dd>
    </div>
  )
}
