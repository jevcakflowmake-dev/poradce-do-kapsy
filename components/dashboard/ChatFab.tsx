'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MessageCircle } from 'lucide-react'

/**
 * Plovoucí tlačítko chatu. Jen na desktopu — na mobilu je chat ve spodní
 * liště a dvě tlačítka na stejnou věc v jednom rohu si překážejí.
 */
export default function ChatFab() {
  const pathname = usePathname()
  // Na chatu je to zbytečné a na formulářích (analýza, dotazník) by plovoucí
  // tlačítko překrývalo hlavní akci „Pokračovat/Odeslat" vpravo dole.
  const skryt = ['/dashboard/chat', '/dashboard/analyza', '/dashboard/zajisteni-prijmu']
  if (skryt.some((p) => pathname.startsWith(p))) return null

  return (
    <Link
      href="/dashboard/chat"
      className="hidden lg:flex fixed bottom-8 right-8 z-30 items-center gap-2 h-14 px-6 rounded-pill bg-mint text-navy font-semibold shadow-card hover:bg-mint-dark transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40"
    >
      <MessageCircle className="w-5 h-5" aria-hidden strokeWidth={2} />
      Napsat poradci
    </Link>
  )
}
