'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutGrid, FileText, Target, FolderOpen, MessageCircle, LogOut } from 'lucide-react'

/**
 * Navigace klientské zóny. Na desktopu navy sidebar vlevo, na mobilu spodní
 * lišta — palec na ni dosáhne, na rozdíl od hamburgeru v horním rohu.
 * Krátké popisky na mobilu jsou schválně: pět položek se do řádku jinak nevejde.
 */
const POLOZKY = [
  { href: '/dashboard', label: 'Přehled', mobil: 'Přehled', icon: LayoutGrid },
  { href: '/dashboard/produkty', label: 'Moje smlouvy', mobil: 'Smlouvy', icon: FileText },
  { href: '/dashboard/financni-plan', label: 'Finanční plán', mobil: 'Plán', icon: Target },
  { href: '/dashboard/dokumenty', label: 'Dokumenty', mobil: 'Soubory', icon: FolderOpen },
  { href: '/dashboard/chat', label: 'Chat s poradcem', mobil: 'Chat', icon: MessageCircle },
]

export default function Sidebar({
  firstName,
  neprectene = 0,
}: {
  firstName: string
  neprectene?: number
}) {
  const pathname = usePathname()
  const jeAktivni = (href: string) => (href === '/dashboard' ? pathname === href : pathname.startsWith(href))

  return (
    <>
      {/* Mobil: horní lišta se značkou a odhlášením */}
      <header className="lg:hidden sticky top-0 z-30 bg-navy text-cream">
        <div className="px-6 h-16 flex items-center justify-between">
          <Link
            href="/dashboard"
            aria-label="Poradce do kapsy — přehled"
            className="flex items-center gap-2.5 rounded-pill focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40"
          >
            <span aria-hidden className="w-8 h-8 rounded-input bg-mint flex items-end justify-end p-1.5">
              <span className="block w-1.5 h-1.5 rounded-pill bg-navy" />
            </span>
            <span className="font-display">Poradce do kapsy</span>
          </Link>
          <form action="/api/auth/signout" method="POST">
            <button
              className="p-2 rounded-pill text-cream/70 hover:text-cream focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40"
              aria-label="Odhlásit se"
            >
              <LogOut className="w-5 h-5" aria-hidden />
            </button>
          </form>
        </div>
      </header>

      {/* Desktop: sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 bg-navy text-cream flex-col">
        <Link
          href="/dashboard"
          aria-label="Poradce do kapsy — přehled"
          className="flex items-center gap-2.5 px-6 h-20 rounded-pill focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40"
        >
          <span aria-hidden className="w-9 h-9 rounded-input bg-mint flex items-end justify-end p-2">
            <span className="block w-1.5 h-1.5 rounded-pill bg-navy" />
          </span>
          <span className="font-display text-lg">Poradce do kapsy</span>
        </Link>

        <nav aria-label="Hlavní" className="flex-1 px-3 py-4 space-y-1">
          {POLOZKY.map((p) => {
            const aktivni = jeAktivni(p.href)
            const Ikona = p.icon
            return (
              <Link
                key={p.href}
                href={p.href}
                aria-current={aktivni ? 'page' : undefined}
                className={`flex items-center gap-3 px-3 py-3 rounded-input text-base transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40 ${
                  aktivni ? 'bg-mint/15 text-mint' : 'text-cream/75 hover:text-cream hover:bg-cream/5'
                }`}
              >
                <Ikona className="w-5 h-5 shrink-0" aria-hidden strokeWidth={1.8} />
                <span className="flex-1">{p.label}</span>
                {p.href === '/dashboard/chat' && neprectene > 0 && (
                  <span
                    className="min-w-6 h-6 px-1.5 rounded-pill bg-mint text-navy text-base font-semibold flex items-center justify-center"
                    aria-label={`${neprectene} nepřečtených zpráv`}
                  >
                    {neprectene}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        <div className="px-3 pb-5">
          <div className="flex items-center gap-3 px-3 py-3 border-t border-cream/10">
            <span
              aria-hidden
              className="w-9 h-9 rounded-pill bg-cream/10 text-cream flex items-center justify-center font-semibold"
            >
              {firstName[0]?.toUpperCase()}
            </span>
            <span className="flex-1 truncate text-base">{firstName}</span>
            <form action="/api/auth/signout" method="POST">
              <button
                className="p-2 rounded-pill text-cream/70 hover:text-cream focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40"
                aria-label="Odhlásit se"
              >
                <LogOut className="w-5 h-5" aria-hidden />
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Mobil: spodní lišta */}
      <nav
        aria-label="Hlavní"
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-navy border-t border-cream/10 pb-[env(safe-area-inset-bottom)]"
      >
        <ul className="grid grid-cols-5">
          {POLOZKY.map((p) => {
            const aktivni = jeAktivni(p.href)
            const Ikona = p.icon
            return (
              <li key={p.href}>
                <Link
                  href={p.href}
                  aria-current={aktivni ? 'page' : undefined}
                  className={`relative flex flex-col items-center gap-1 py-3 text-base focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40 ${
                    aktivni ? 'text-mint' : 'text-cream/70'
                  }`}
                >
                  <Ikona className="w-5 h-5" aria-hidden strokeWidth={1.8} />
                  <span className="text-[13px] leading-none">{p.mobil}</span>
                  {p.href === '/dashboard/chat' && neprectene > 0 && (
                    <span
                      className="absolute top-1.5 right-1/4 min-w-5 h-5 px-1 rounded-pill bg-mint text-navy text-[12px] font-semibold flex items-center justify-center"
                      aria-label={`${neprectene} nepřečtených zpráv`}
                    >
                      {neprectene}
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </>
  )
}
