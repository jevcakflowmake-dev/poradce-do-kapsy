import type { ReactNode } from 'react'

type Props = {
  eyebrow?: string
  numeral?: string
  title: ReactNode
  subtitle?: ReactNode
  right?: ReactNode
}

/**
 * Sjednocený header pro všechny interní stránky.
 * - numeral (01, 02…) jako Fraunces italic, accent, opacity 0.22
 * - eyebrow — tracking uppercase
 * - title — Fraunces, "jedno slovo italic cyan" pattern doporučený
 */
export default function PageHeader({ eyebrow, numeral, title, subtitle, right }: Props) {
  return (
    <header className="mb-8 md:mb-12">
      {numeral && <div className="section-numeral text-[3rem] md:text-[4.5rem] mb-2">{numeral}</div>}
      {eyebrow && (
        <p className="text-xs tracking-[0.3em] uppercase text-[#818EAF] mb-2">{eyebrow}</p>
      )}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <h1
          className="font-display text-[#162459]"
          style={{
            fontSize: 'clamp(1.75rem, 4vw, 3rem)',
            letterSpacing: '-0.02em',
            lineHeight: 1.05,
          }}
        >
          {title}
        </h1>
        {right}
      </div>
      {subtitle && (
        <p className="text-[#818EAF] max-w-2xl mt-4 text-[15px] leading-relaxed">{subtitle}</p>
      )}
    </header>
  )
}
