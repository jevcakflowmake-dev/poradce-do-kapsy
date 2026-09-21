import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

/**
 * Společná kostra právních stránek (zásady, cookies, obchodní podmínky).
 * Všechny tři vypadají stejně, takže sazba žije na jednom místě — jinak se
 * po první úpravě rozejdou.
 */
export function PravniStranka({
  nadrazene,
  nadpis,
  perex,
  ucinnostOd,
  children,
}: {
  /** Krátké zařazení nad nadpisem, např. „Ochrana soukromí“. */
  nadrazene: string
  nadpis: React.ReactNode
  perex: React.ReactNode
  ucinnostOd: string
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-cream">
      <div className="px-6 md:px-10 lg:px-16 xl:px-20 py-16 md:py-24">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-base text-slate hover:text-navy transition-colors mb-12 rounded-pill focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden />
            Zpět na úvod
          </Link>

          <p className="flex items-center gap-3 text-xs tracking-[0.3em] uppercase text-slate mb-6">
            <span className="inline-block w-10 h-px bg-mint" aria-hidden />
            {nadrazene}
          </p>

          <h1 className="font-display text-navy mb-6 text-h2">{nadpis}</h1>

          <div className="text-lead text-slate leading-relaxed mb-4">{perex}</div>
          <p className="text-base text-slate mb-14">Účinné od {ucinnostOd}</p>

          {children}

          <div className="mt-16 pt-8 border-t border-line">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-base text-slate hover:text-navy transition-colors rounded-pill focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden />
              Zpět na úvod
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export function Section({
  number,
  title,
  children,
}: {
  number: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="mb-14">
      <div className="flex items-baseline gap-4 mb-5 pb-4 border-b border-line">
        <span className="text-xs tabular-nums tracking-[0.2em] text-navy">{number}</span>
        <h2 className="font-display text-navy text-h3">{title}</h2>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

export function P({ children }: { children: React.ReactNode }) {
  return <p className="text-base text-slate leading-relaxed">{children}</p>
}

export function B({ children }: { children: React.ReactNode }) {
  return <strong className="font-semibold text-navy">{children}</strong>
}

export function List({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 text-base text-slate leading-relaxed">
          <span className="mt-2.5 w-1 h-1 rounded-full bg-mint flex-shrink-0" aria-hidden />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

export function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-surface border border-line border-l-2 border-l-mint p-5 md:p-6 space-y-4">
      {children}
    </div>
  )
}

/** Odkaz uvnitř právního textu — stejný všude, ať už vede ven nebo dovnitř. */
export function Odkaz({ href, children }: { href: string; children: React.ReactNode }) {
  const venku = href.startsWith('http')
  const trida =
    'text-navy underline underline-offset-4 hover:text-mint-dark rounded-pill focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40'
  return venku ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={trida}>
      {children}
    </a>
  ) : (
    <Link href={href} className={trida}>
      {children}
    </Link>
  )
}
