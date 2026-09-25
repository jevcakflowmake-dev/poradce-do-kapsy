import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

/**
 * Lepkavá lišta podstránek u klienta (smlouva, náhled plánu): zpět na detail
 * a jméno klienta s názvem stránky.
 */
export default function HlavickaPodstranky({
  clientId,
  jmeno,
  nazev,
  children,
}: {
  clientId: string
  jmeno: string
  nazev: string
  /** Akce vpravo v liště. */
  children?: React.ReactNode
}) {
  return (
    <nav className="bg-surface border-b border-line px-6 md:px-10 lg:px-16 xl:px-20 py-4 sticky top-0 z-30">
      <div className="max-w-8xl mx-auto flex items-center gap-3">
        <Link
          href={`/advisor/${clientId}`}
          className="inline-flex items-center gap-1 text-slate hover:text-navy transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden />
          <span className="hidden sm:inline">Detail</span>
          <span className="sr-only sm:hidden">Zpět na detail klienta</span>
        </Link>
        <div className="h-6 w-px bg-line mx-1 hidden sm:block" />
        <span className="font-semibold text-navy flex-1 truncate">
          {jmeno} · {nazev}
        </span>
        {children}
      </div>
    </nav>
  )
}
