import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { CLIENT_STATUS_VALUES, CLIENT_STATUS_META } from '@/lib/utils'

/**
 * Kolik klientů je v kterém stavu. Řádek vede na seznam klientů
 * s tím stavem – nahrazuje sedm filtrů, které byly dřív nad tabulkou.
 */
export default function PipelineSouhrn({ vStavu }: { vStavu: Record<string, number> }) {
  return (
    <section aria-labelledby="pipeline" className="rounded-card border border-line bg-surface overflow-hidden">
      <h2 id="pipeline" className="font-display text-navy text-h3 px-5 md:px-6 pt-5 md:pt-6 pb-4">
        Pipeline
      </h2>
      <ul className="border-t border-line divide-y divide-line">
        {CLIENT_STATUS_VALUES.map((s) => {
          const pocet = vStavu[s] ?? 0
          return (
            <li key={s}>
              <Link
                href={`/advisor/klienti?status=${s}`}
                className="flex items-center gap-3 px-5 md:px-6 py-3 transition-colors hover:bg-cream focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-mint/40"
              >
                <span aria-hidden className="w-2 h-2 rounded-pill shrink-0" style={{ background: CLIENT_STATUS_META[s].dot }} />
                <span className={`flex-1 text-base ${pocet > 0 ? 'text-navy' : 'text-slate'}`}>{CLIENT_STATUS_META[s].label}</span>
                <span className={`text-base tabular-nums ${pocet > 0 ? 'font-semibold text-navy' : 'text-slate'}`}>{pocet}</span>
              </Link>
            </li>
          )
        })}
      </ul>
      <div className="border-t border-line px-5 md:px-6 py-3">
        <Link
          href="/advisor/klienti"
          className="inline-flex items-center gap-1.5 py-1 text-base font-semibold text-navy rounded-pill hover:underline underline-offset-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40"
        >
          Všichni klienti <ArrowRight className="w-4 h-4" aria-hidden />
        </Link>
      </div>
    </section>
  )
}
