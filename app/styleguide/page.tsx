import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardTitle } from '@/components/ui/card'

// Dočasná stránka pro kontrolu designového systému během přepisu.
// Mizí v posledním kroku, do vyhledávačů ji nepouštíme.
export const metadata = { robots: { index: false, follow: false } }

const BARVY = [
  { jmeno: 'navy', trida: 'bg-navy', hex: '#0F2A44' },
  { jmeno: 'mint', trida: 'bg-mint', hex: '#1FB58F' },
  { jmeno: 'cream', trida: 'bg-cream', hex: '#F6F5F1' },
  { jmeno: 'amber', trida: 'bg-amber', hex: '#F2B441' },
  { jmeno: 'slate', trida: 'bg-slate', hex: '#64707D' },
  { jmeno: 'slate-soft', trida: 'bg-slate-soft', hex: '#7A8794' },
]

export default function StyleguidePage() {
  return (
    <div className="bg-cream min-h-screen">
      <div className="max-w-8xl mx-auto px-6 md:px-10 lg:px-16 xl:px-20 py-16 space-y-16">
        <section className="space-y-4">
          <h1 className="font-display text-display text-navy">Finanční poradce, kterého máte v mobilu.</h1>
          <h2 className="font-display text-h2 text-navy">Nadpis druhé úrovně</h2>
          <h3 className="font-display text-h3 text-navy">Nadpis třetí úrovně</h3>
          <p className="text-lead text-navy max-w-2xl">
            Vedoucí odstavec o 18 px. Vyplníte analýzu za 15 minut, do 48 hodin dostanete návrh na míru.
          </p>
          <p className="text-base text-slate max-w-2xl">
            Běžný text o 16 px v sekundární šedé. Nikdy nejde pod šestnáct pixelů.
          </p>
          <div className="bg-navy rounded-card p-6">
            <p className="text-base text-cream/70">Amber jen na tmavém pozadí (na krému má kontrast 1,7:1)</p>
            <p className="font-display text-h2 text-amber mt-1">4 820 Kč</p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-h3 text-navy">Barvy</h2>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {BARVY.map((b) => (
              <div key={b.jmeno} className="space-y-2">
                <div className={`${b.trida} h-20 rounded-card border border-line`} />
                <div className="text-base text-navy font-medium">{b.jmeno}</div>
                <div className="text-base text-slate">{b.hex}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-h3 text-navy">Tlačítka na světlém</h2>
          <div className="flex flex-wrap gap-3">
            <Button>Vyplnit analýzu zdarma</Button>
            <Button variant="navy">Navy akce</Button>
            <Button variant="outline">Jak to funguje</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Odkaz</Button>
            <Button size="sm">Malé</Button>
            <Button size="lg">Velké</Button>
            <Button disabled>Neaktivní</Button>
          </div>
        </section>

        <section className="bg-navy rounded-card p-8 space-y-4">
          <h2 className="font-display text-h3 text-cream">Tlačítka na tmavém</h2>
          <div className="flex flex-wrap gap-3">
            <Button>Vyplnit analýzu zdarma</Button>
            <Button variant="onDark">Jak to funguje</Button>
          </div>
          <p className="text-base text-cream/70">Pod tlačítky drobný text · Nic nepodepisujete · Data v EU</p>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-h3 text-navy">Karta a formulář</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6 space-y-2">
              <CardTitle>Měsíčně platíte</CardTitle>
              <p className="font-display text-h2 text-navy">4 820 Kč</p>
              <p className="text-base text-slate">Součet za všechny smlouvy, které pro vás vedu.</p>
            </Card>
            <Card className="p-6 space-y-3">
              <Label htmlFor="mail">E-mail</Label>
              <Input id="mail" type="email" placeholder="vas@email.cz" />
              <Button className="w-full">Pokračovat</Button>
            </Card>
          </div>
        </section>
      </div>
    </div>
  )
}
