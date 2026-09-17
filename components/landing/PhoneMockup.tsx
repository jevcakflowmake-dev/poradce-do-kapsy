/**
 * Mockup dashboardu v telefonu. Záměrně ukazuje reálnou obrazovku s čísly,
 * ne abstraktní ilustraci — konkurence produkt schovává za přihlášení.
 * Celé je to HTML a CSS, takže hero nepotáhne žádné další aktivum.
 * Pro čtečky je to dekorace: stejná čísla jsou v textu sekce.
 */
export default function PhoneMockup() {
  return (
    <div aria-hidden className="mx-auto w-[280px] sm:w-[320px]">
      <div className="rounded-[2.5rem] border border-cream/15 bg-navy-soft p-3">
        <div className="rounded-[2rem] bg-cream p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-base font-medium text-slate">Přehled</span>
            <span className="w-7 h-7 rounded-pill bg-navy text-cream text-base font-semibold flex items-center justify-center">
              P
            </span>
          </div>

          <p className="font-display text-h3 text-navy">Dobrý den, Petro.</p>

          <div className="rounded-card border border-line bg-surface p-4">
            <p className="text-base text-slate">Měsíčně platíte</p>
            <p className="font-display text-navy text-3xl mt-1">4 820 Kč</p>
          </div>

          <div className="rounded-card bg-mint px-4 py-3 flex items-center justify-between">
            <span className="text-base font-medium text-navy">Možná úspora</span>
            <span className="font-display text-navy text-lg">1 140 Kč</span>
          </div>

          <div className="space-y-2 pt-1">
            {[
              { nazev: 'Životní pojištění', stav: 'Aktivní' },
              { nazev: 'Penzijní spoření', stav: 'Ke kontrole' },
            ].map((s) => (
              <div key={s.nazev} className="rounded-card border border-line bg-surface px-4 py-3 flex items-center justify-between gap-3">
                <span className="text-base text-navy">{s.nazev}</span>
                <span className="text-base text-slate whitespace-nowrap">{s.stav}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
