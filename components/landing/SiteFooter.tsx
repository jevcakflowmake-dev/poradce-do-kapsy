import Link from 'next/link'
import { PORADCE } from '@/lib/poradce'

/**
 * Patička veřejné části. Slot pro označení vázaného zástupce zůstává prázdný,
 * dokud Jakub nedodá přesné znění (lib/poradce.ts) — do té doby se nevykreslí.
 */
export default function SiteFooter() {
  return (
    <footer className="bg-cream border-t border-line">
      <div className="max-w-8xl mx-auto px-6 md:px-10 lg:px-16 xl:px-20 py-12 flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
        <div className="flex items-center gap-2.5">
          <span aria-hidden className="w-8 h-8 rounded-input bg-navy flex items-end justify-end p-1.5">
            <span className="block w-1.5 h-1.5 rounded-pill bg-mint" />
          </span>
          <span className="font-display text-navy">Poradce do kapsy</span>
        </div>

        <nav aria-label="Patička" className="flex flex-wrap gap-x-6 gap-y-2">
          <a href="#jak-to-funguje" className="text-base text-slate hover:text-navy transition-colors rounded-pill focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40">Jak to funguje</a>
          <a href="#kolik-to-stoji" className="text-base text-slate hover:text-navy transition-colors rounded-pill focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40">Kolik to stojí</a>
          <a href="#caste-dotazy" className="text-base text-slate hover:text-navy transition-colors rounded-pill focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40">Časté dotazy</a>
          <Link href="/zasady-ochrany-osobnich-udaju" className="text-base text-slate hover:text-navy transition-colors rounded-pill focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40">
            Ochrana údajů
          </Link>
          <Link href="/login" className="text-base text-slate hover:text-navy transition-colors rounded-pill focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40">Přihlášení</Link>
        </nav>

        <div className="md:text-right space-y-1.5">
          {PORADCE.vazanyZastupce && (
            <p className="text-base text-slate max-w-xs md:ml-auto">{PORADCE.vazanyZastupce}</p>
          )}
          <p className="text-base text-slate">© 2026 {PORADCE.jmeno}</p>
          <p className="text-base text-slate">
            Web vytvořil{' '}
            <a
              href="https://www.robology.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 hover:text-navy transition-colors rounded-pill focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40"
            >
              &gt;robology
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
