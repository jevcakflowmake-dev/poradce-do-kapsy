import Link from 'next/link'
import { LogIn } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'

/**
 * Hlavička landingu. Jeden cíl stránky = jeden cíl hlavičky, proto tu jsou
 * jen tři kotvy, přihlášení a CTA. Žádné rozbalovací menu ani odkazy pryč
 * ze stránky.
 *
 * Lišta zůstává při scrollování nahoře. Schválně bez rozostření pozadí:
 * `backdrop-filter` udělá z lišty containing block pro `fixed` potomky a plná
 * navy stačí. Nad tmavými sekcemi (ceník) by ale lišta splynula s obsahem,
 * proto vlasová linka dole.
 *
 * Kotvy sekcí mají `scroll-mt-28` (lišta 80 px + mezera), jinak by nadpis
 * po prokliku skončil schovaný pod lištou.
 *
 * Šířky: kotvy se vejdou až od `lg` — do té doby se lámaly na tři řádky.
 * Celá věta v CTA a popisek u přihlášení až od `xl`, protože na 1024 px
 * zbývá po kotvách jen kolem 80 px; níž je z přihlášení ikona.
 */
const ODKAZY = [
  { href: '#jak-to-funguje', label: 'Jak to funguje' },
  { href: '#kolik-to-stoji', label: 'Kolik to stojí' },
  { href: '#caste-dotazy', label: 'Časté dotazy' },
]

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 bg-navy border-b border-cream/10">
      <div className="max-w-8xl mx-auto px-6 md:px-10 lg:px-16 xl:px-20 h-20 flex items-center justify-between gap-4">
        <Link
          href="/"
          // Pod sm je vidět jen dlaždice, takže odkaz potřebuje vlastní název
          aria-label="Poradce do kapsy — úvodní stránka"
          className="shrink-0 flex items-center gap-2.5 rounded-pill focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40"
        >
          <span aria-hidden className="w-9 h-9 rounded-input bg-mint flex items-end justify-end p-2">
            <span className="block w-1.5 h-1.5 rounded-pill bg-navy" />
          </span>
          <span className="font-display text-cream text-lg whitespace-nowrap hidden sm:block">Poradce do kapsy</span>
        </Link>

        <nav aria-label="Sekce stránky" className="hidden lg:flex items-center gap-6">
          {ODKAZY.map((o) => (
            <a
              key={o.href}
              href={o.href}
              className="text-base whitespace-nowrap text-cream/80 hover:text-cream transition-colors rounded-pill px-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40"
            >
              {o.label}
            </a>
          ))}
        </nav>

        <div className="shrink-0 flex items-center gap-2 sm:gap-3">
          <Link
            href="/login"
            aria-label="Přihlásit se"
            title="Přihlásit se"
            // Velikost `icon` (h-11 w-11) schválně místo `sm` s přepsaným
            // odsazením: `buttonVariants()` nejde přes `cn`, takže se
            // konfliktní třídy nesloučí a v CSS vyhraje `px-5` nad `px-0`.
            className={buttonVariants({ variant: 'onDark', size: 'icon', className: 'xl:w-auto xl:px-5' })}
          >
            <LogIn aria-hidden className="w-5 h-5 xl:hidden" />
            <span className="hidden xl:inline">Přihlásit se</span>
          </Link>

          <Link href="/analyza" className={buttonVariants({ size: 'sm' })}>
            {/* Vedle značky, kotev a přihlášení se celá věta vejde až na širokém displeji */}
            <span className="xl:hidden">Vyplnit analýzu</span>
            <span className="hidden xl:inline">Vyplnit analýzu zdarma</span>
          </Link>
        </div>
      </div>
    </header>
  )
}
