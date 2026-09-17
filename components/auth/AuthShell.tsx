import Link from 'next/link'
import type { ReactNode } from 'react'
import { PORADCE } from '@/lib/poradce'

type Props = {
  eyebrow: string
  /** Stavový glyf (↻ načítá, ✗ chyba, ↗ odesláno). Volitelný — přihlášení
   *  a registrace ho nemají, web pořadová čísla nepoužívá. */
  numeral?: string
  title: ReactNode
  subtitle?: ReactNode
  children: ReactNode
  aside?: ReactNode
}

export default function AuthShell({ eyebrow, numeral, title, subtitle, children, aside }: Props) {
  return (
    <div className="min-h-screen bg-cream flex flex-col lg:flex-row">
      {/* Značkový sloupec — na mobilu pruh nad formulářem, na desktopu vedle něj */}
      <aside className="bg-navy lg:w-[44%] xl:w-[40%] lg:min-h-screen">
        <div className="flex flex-col justify-between h-full p-6 md:p-10 lg:p-14 gap-10">
          <Link
            href="/"
            aria-label="Poradce do kapsy — úvodní stránka"
            className="inline-flex items-center gap-2.5 w-fit rounded-pill focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40"
          >
            <span aria-hidden className="w-9 h-9 rounded-input bg-mint flex items-end justify-end p-2">
              <span className="block w-1.5 h-1.5 rounded-pill bg-navy" />
            </span>
            <span className="font-display text-cream text-lg tracking-tight">Poradce do kapsy</span>
          </Link>

          <div>
            {numeral && (
              <div aria-hidden className="font-display text-mint text-h2 mb-4 leading-none">
                {numeral}
              </div>
            )}
            <p className="text-base text-mint mb-3">{eyebrow}</p>
            <h1 className="font-display text-cream text-h2 text-balance">{title}</h1>
            {subtitle && <p className="text-cream/75 text-lead mt-4 max-w-sm text-pretty">{subtitle}</p>}
          </div>

          {/* TODO: znění vázaného zástupce doplnit v lib/poradce.ts */}
          <p className="text-base text-cream/60">{aside ?? PORADCE.vazanyZastupce}</p>
        </div>
      </aside>

      <main className="flex-1 flex items-center justify-center p-6 md:p-10 lg:p-14">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  )
}
