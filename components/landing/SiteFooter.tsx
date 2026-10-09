import Link from 'next/link'
import { PORADCE } from '@/lib/poradce'

const TRIDA_ODKAZU =
  'text-base text-slate hover:text-navy transition-colors rounded-pill focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40'

const KOTVY = [
  { href: '#jak-to-funguje', label: 'Jak to funguje' },
  { href: '#kolik-to-stoji', label: 'Kolik to stojí' },
  { href: '#caste-dotazy', label: 'Časté dotazy' },
]

/**
 * Patička veřejné části. Slot pro označení vázaného zástupce zůstává prázdný,
 * dokud Jakub nedodá přesné znění (lib/poradce.ts) — do té doby se nevykreslí.
 *
 * `naUvod` patří všude mimo úvodní stránku: kotvy sekcí tam samy o sobě
 * nikam nevedou, takže míří na úvodní stránku.
 */
export default function SiteFooter({ naUvod = false }: { naUvod?: boolean }) {
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
          {KOTVY.map((k) =>
            naUvod ? (
              <Link key={k.href} href={`/${k.href}`} className={TRIDA_ODKAZU}>
                {k.label}
              </Link>
            ) : (
              <a key={k.href} href={k.href} className={TRIDA_ODKAZU}>
                {k.label}
              </a>
            ),
          )}
          <Link href="/zasady-ochrany-osobnich-udaju" className="text-base text-slate hover:text-navy transition-colors rounded-pill focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40">
            Ochrana údajů
          </Link>
          <Link href="/obchodni-podminky" className="text-base text-slate hover:text-navy transition-colors rounded-pill focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40">
            Obchodní podmínky
          </Link>
          <Link href="/zasady-cookies" className="text-base text-slate hover:text-navy transition-colors rounded-pill focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40">Cookies</Link>
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
