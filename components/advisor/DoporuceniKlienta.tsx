'use client'

import { useId, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { POPIS_STAVU, type StavDoporuceni } from '@/lib/doporuceni'
import { plural } from '@/lib/utils'

export interface OdKoho {
  doporucitelId: string
  jmeno: string
  stav: StavDoporuceni
  rucne: boolean
}

export interface BodDoporuceni {
  doporucenyId: string
  jmeno: string
  stav: StavDoporuceni
  odmenaKc: number
  vyplacenoAt: string | null
}

const BARVA_STAVU: Record<StavDoporuceni, string> = {
  ceka_na_smlouvu: 'bg-cream text-slate border-line',
  k_proplaceni: 'bg-amber/25 text-navy border-amber/50',
  vyplaceno: 'bg-mint/15 text-navy border-mint/30',
}

/** Pevně pražský čas – server na Vercelu běží v UTC a datum by se při hydrataci lišilo. */
const datum = (iso: string) => new Date(iso).toLocaleDateString('cs-CZ', { timeZone: 'Europe/Prague' })
const kc = (n: number) => `${n.toLocaleString('cs-CZ')} Kč`

function Stav({ stav }: { stav: StavDoporuceni }) {
  return (
    <span className={`shrink-0 whitespace-nowrap rounded-pill border px-2.5 py-0.5 text-sm ${BARVA_STAVU[stav]}`}>
      {POPIS_STAVU[stav]}
    </span>
  )
}

/**
 * Doporučení a věrnostní body v detailu klienta (lib/doporuceni.ts):
 * od koho klient přišel – s možností doporučitele přiřadit nebo změnit,
 * když jméno z analýzy nesedí – a body za lidi, které doporučil on.
 * U bodu k proplacení se po poslání poukázky označí „Poukázka odeslána“.
 */
export default function DoporuceniKlienta({
  clientId,
  uvedeneJmeno,
  odKoho,
  navrh,
  klienti,
  body,
}: {
  clientId: string
  /** Co klient napsal v analýze do „Kdo vám mě doporučil?“. */
  uvedeneJmeno: string | null
  odKoho: OdKoho | null
  /** Klient, na kterého jméno z analýzy sedí – předvyplní výběr. */
  navrh: string | null
  klienti: Array<{ id: string; jmeno: string }>
  body: BodDoporuceni[]
}) {
  const router = useRouter()
  const uid = useId()
  const [vyber, setVyber] = useState(navrh ?? '')
  const [prirazuje, setPrirazuje] = useState(false)
  const [pracuje, setPracuje] = useState<string | null>(null)
  const [chyba, setChyba] = useState<string | null>(null)

  async function zavolej(metoda: 'POST' | 'PATCH' | 'DELETE', telo: object, klic: string): Promise<boolean> {
    setPracuje(klic)
    setChyba(null)
    try {
      const res = await fetch('/api/advisor/doporuceni', {
        method: metoda,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(telo),
      })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) {
        setChyba(payload.error ?? 'Změnu se nepodařilo uložit.')
        return false
      }
      router.refresh()
      return true
    } catch {
      setChyba('Chyba připojení. Zkuste to prosím znovu.')
      return false
    } finally {
      setPracuje(null)
    }
  }

  async function priradit(e: React.FormEvent) {
    e.preventDefault()
    if (!vyber) return
    if (await zavolej('POST', { doporuceny_id: clientId, doporucitel_id: vyber }, 'prirazeni')) setPrirazuje(false)
  }

  const kProplaceni = body.filter((b) => b.stav === 'k_proplaceni')
  const formularOtevreny = prirazuje || (!odKoho && Boolean(uvedeneJmeno))

  return (
    <section id="doporuceni" aria-labelledby={`${uid}-nadpis`} className="scroll-mt-24 rounded-card border border-line bg-surface p-6 md:p-7">
      <p className="text-xs tracking-[0.25em] uppercase text-slate mb-1.5">Věrnostní body</p>
      <h2 id={`${uid}-nadpis`} className="font-display text-navy text-h3">
        Doporučení
      </h2>

      <div className="mt-4 text-base text-navy">
        {odKoho ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <p>
              Na doporučení od{' '}
              <Link href={`/advisor/${odKoho.doporucitelId}`} className="font-semibold underline underline-offset-4 hover:text-mint-dark">
                {odKoho.jmeno}
              </Link>
            </p>
            <Stav stav={odKoho.stav} />
          </div>
        ) : (
          <p className="text-slate text-pretty">
            {uvedeneJmeno
              ? `V analýze uvedl(a) „${uvedeneJmeno}“, ale jméno nesedí na jediného klienta. Přiřaďte doporučitele ručně.`
              : 'Klient nikoho neuvedl.'}
          </p>
        )}
        {odKoho && uvedeneJmeno && (
          <p className="mt-1 text-sm text-slate">
            V analýze: „{uvedeneJmeno}“{odKoho.rucne && ' · přiřazeno ručně'}
          </p>
        )}

        {formularOtevreny ? (
          <form onSubmit={priradit} className="mt-4 flex flex-col sm:flex-row sm:items-end gap-3">
            <div className="min-w-0 flex-1">
              <label htmlFor={`${uid}-vyber`} className="block text-sm text-slate mb-1.5">
                Kdo klienta doporučil
              </label>
              <select
                id={`${uid}-vyber`}
                value={vyber}
                onChange={(e) => setVyber(e.target.value)}
                className="w-full h-11 rounded-input border border-line bg-surface px-3 text-base text-navy focus:outline-none focus:border-mint focus:ring-4 focus:ring-mint/20"
              >
                <option value="">Vyberte klienta</option>
                {klienti.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.jmeno}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" variant="navy" size="sm" disabled={!vyber || pracuje !== null}>
              {pracuje === 'prirazeni' && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />}
              Připsat bod
            </Button>
            {prirazuje && (
              <Button type="button" variant="ghost" size="sm" onClick={() => setPrirazuje(false)}>
                Zrušit
              </Button>
            )}
          </form>
        ) : (
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
            <button
              type="button"
              onClick={() => setPrirazuje(true)}
              className="py-1 text-sm font-semibold text-navy underline underline-offset-4 hover:text-mint-dark rounded-pill focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40"
            >
              {odKoho ? 'Změnit doporučitele' : 'Přiřadit doporučitele'}
            </button>
            {odKoho && odKoho.stav !== 'vyplaceno' && (
              <button
                type="button"
                disabled={pracuje !== null}
                onClick={() => zavolej('DELETE', { doporuceny_id: clientId }, 'odebrani')}
                className="py-1 text-sm font-semibold text-slate underline underline-offset-4 hover:text-danger rounded-pill focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40 disabled:opacity-50"
              >
                Odebrat doporučení
              </button>
            )}
          </div>
        )}
      </div>

      {body.length > 0 && (
        <div className="mt-6 pt-5 border-t border-line">
          <h3 className="text-base font-semibold text-navy">Body za jeho doporučení</h3>
          {kProplaceni.length > 0 && (
            <p className="mt-1 text-base text-slate">
              K proplacení {kc(kProplaceni.reduce((s, b) => s + b.odmenaKc, 0))} ({kProplaceni.length}{' '}
              {plural(kProplaceni.length, 'poukázka', 'poukázky', 'poukázek')})
            </p>
          )}
          <ul className="mt-3 divide-y divide-line">
            {body.map((b) => (
              <li key={b.doporucenyId} className="py-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                {/* Na telefonu jméno na vlastním řádku – vedle částky a štítku by se uřízlo. */}
                <Link
                  href={`/advisor/${b.doporucenyId}`}
                  className="w-full sm:w-auto sm:flex-1 min-w-0 sm:truncate font-medium text-navy underline-offset-4 hover:underline"
                >
                  {b.jmeno}
                </Link>
                <span className="text-sm text-slate tabular-nums">{kc(b.odmenaKc)}</span>
                <Stav stav={b.stav} />
                {b.stav === 'k_proplaceni' && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={pracuje !== null}
                    onClick={() => zavolej('PATCH', { doporuceny_id: b.doporucenyId, vyplaceno: true }, b.doporucenyId)}
                  >
                    {pracuje === b.doporucenyId && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />}
                    Poukázka odeslána
                  </Button>
                )}
                {b.stav === 'vyplaceno' && b.vyplacenoAt && (
                  <span className="text-sm text-slate">
                    {datum(b.vyplacenoAt)} ·{' '}
                    <button
                      type="button"
                      disabled={pracuje !== null}
                      onClick={() => zavolej('PATCH', { doporuceny_id: b.doporucenyId, vyplaceno: false }, b.doporucenyId)}
                      className="py-1 underline underline-offset-4 hover:text-navy rounded-pill focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40 disabled:opacity-50"
                    >
                      vrátit
                    </button>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {chyba && (
        <p role="alert" className="mt-4 rounded-card border border-danger/30 bg-danger/10 p-3 text-base text-danger">
          {chyba}
        </p>
      )}
    </section>
  )
}
