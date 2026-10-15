import Link from 'next/link'
import { ArrowUpRight, type LucideIcon } from 'lucide-react'

export interface Ukol {
  klientId: string
  text: string
  odkaz: string
  akce: string
  ikona: LucideIcon
}

/**
 * „K vyřízení“ v Přehledu panelu poradce: co čeká na poradce – zprávy,
 * reakce na plán, rozpracované plány, převody na smlouvy, výročí, poukázky.
 * Úkoly skládá stránka, tady se jen vypisují.
 */
export default function KVyrizeni({ ukoly, jmeno }: { ukoly: Ukol[]; jmeno: ReadonlyMap<string, string> }) {
  return (
    <section aria-labelledby="k-vyrizeni" className="rounded-card border border-line bg-surface p-5 md:p-6">
      <h2 id="k-vyrizeni" className="font-display text-navy text-h3 flex items-center gap-2">
        K vyřízení
        {ukoly.length > 0 && (
          <span className="text-base font-sans font-semibold rounded-pill bg-amber/25 px-2.5 py-0.5 tabular-nums">{ukoly.length}</span>
        )}
      </h2>
      {ukoly.length === 0 ? (
        <p className="mt-2 text-base text-slate">Teď nic nečeká. Nové zprávy, reakce na plán i výročí smluv se objeví tady.</p>
      ) : (
        <ul className="mt-4 divide-y divide-line">
          {ukoly.map((u, i) => (
            <li key={`${u.klientId}-${i}`} className="flex items-start gap-3 py-3">
              <u.ikona className="w-4 h-4 text-slate shrink-0 mt-1" aria-hidden />
              {/* Na mobilu akce pod textem – vedle by text stlačila do úzkého sloupce. */}
              <div className="min-w-0 flex-1 sm:flex sm:items-center sm:gap-4">
                <p className="min-w-0 sm:flex-1">
                  <Link href={`/advisor/${u.klientId}`} className="font-semibold text-navy hover:underline underline-offset-4">
                    {jmeno.get(u.klientId)}
                  </Link>
                  <span className="text-slate"> · {u.text}</span>
                </p>
                <Link
                  href={u.odkaz}
                  className="mt-1 sm:mt-0 inline-flex items-center gap-1 text-sm font-semibold text-navy whitespace-nowrap rounded-pill hover:underline underline-offset-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40"
                >
                  {u.akce} <ArrowUpRight className="w-3.5 h-3.5" aria-hidden />
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
