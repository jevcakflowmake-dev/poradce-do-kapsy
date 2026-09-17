import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'

/**
 * Hlavička landingu. Jeden cíl stránky = jeden cíl hlavičky, proto tu jsou
 * jen tři kotvy a CTA. Žádné rozbalovací menu ani odkazy pryč ze stránky.
 * Na mobilu kotvy schováme — sekce jsou hned pod sebou a CTA musí zůstat.
 */
const ODKAZY = [
  { href: '#jak-to-funguje', label: 'Jak to funguje' },
  { href: '#kolik-to-stoji', label: 'Kolik to stojí' },
  { href: '#caste-dotazy', label: 'Časté dotazy' },
]

export default function SiteHeader() {
  return (
    <header className="bg-navy">
      <div className="max-w-8xl mx-auto px-6 md:px-10 lg:px-16 xl:px-20 h-20 flex items-center justify-between gap-4">
        <Link
          href="/"
          // Pod sm je vidět jen dlaždice, takže odkaz potřebuje vlastní název
          aria-label="Poradce do kapsy — úvodní stránka"
          className="flex items-center gap-2.5 rounded-pill focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40"
        >
          <span aria-hidden className="w-9 h-9 rounded-input bg-mint flex items-end justify-end p-2">
            <span className="block w-1.5 h-1.5 rounded-pill bg-navy" />
          </span>
          <span className="font-display text-cream text-lg whitespace-nowrap hidden sm:block">Poradce do kapsy</span>
        </Link>

        <nav aria-label="Sekce stránky" className="hidden md:flex items-center gap-8">
          {ODKAZY.map((o) => (
            <a
              key={o.href}
              href={o.href}
              className="text-base text-cream/80 hover:text-cream transition-colors rounded-pill px-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40"
            >
              {o.label}
            </a>
          ))}
        </nav>

        <Link href="/analyza" className={buttonVariants({ size: 'sm' })}>
          {/* Na úzkém displeji se vedle značky nevejde celá věta, ale cíl musí zůstat čitelný */}
          <span className="sm:hidden">Vyplnit analýzu</span>
          <span className="hidden sm:inline">Vyplnit analýzu zdarma</span>
        </Link>
      </div>
    </header>
  )
}
