/**
 * Hlavní odlišení proti konkurenci, která o provizích mlčí. Proto plnohodnotná
 * sekce, ne řádek ve FAQ. Amber číslo je jediné na celé obrazovce.
 *
 * TODO (Jakub): znění odstavce o provizi si projdi, ať sedí s tím, co smíš
 * jako vázaný zástupce tvrdit.
 */
export default function PricingSection() {
  return (
    <section id="kolik-to-stoji" className="bg-navy text-cream py-20 md:py-28 scroll-mt-28 textura-navy">
      <div className="max-w-8xl mx-auto px-6 md:px-10 lg:px-16 xl:px-20">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16 items-start">
          <div>
            <h2 className="font-display text-h2 text-cream text-balance">Kolik to stojí? Nic.</h2>
            <p className="font-display text-display text-amber mt-6 leading-none">0 Kč</p>
            <p className="text-base text-cream/60 mt-3">za analýzu i za návrh</p>
          </div>

          <div className="space-y-5 text-lead text-cream/80 max-w-2xl text-pretty">
            <p>
              Za analýzu ani za návrh neplatíte nic. Nic nepředplácíte a nic nepodepisujete
              předem.
            </p>
            <p>
              Jsem placený provizí od finanční instituce, se kterou nakonec smlouvu uzavřete.
              Provize je součástí ceny produktu – vyjde vás stejně, ať smlouvu sjednáte přese
              mě, nebo přímo na pobočce.
            </p>
            <p>
              Když se rozhodnete neuzavřít nic, nedlužíte mi nic. Analýzu i návrh si necháte.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
