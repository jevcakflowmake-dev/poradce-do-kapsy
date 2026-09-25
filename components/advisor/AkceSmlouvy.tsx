'use client'

import { useId, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatDate } from '@/lib/utils'

/** Dnešek jako RRRR-MM-DD – mimo komponentu, React Compiler nechce Date v renderu. */
function dnes() {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Ukončení, obnovení a smazání smlouvy. Ukončená smlouva zůstává klientovi
 * v přehledu se štítkem „Ukončená“ a nepočítá se do plateb; smazání je
 * nevratné, proto se potvrzuje ještě jednou.
 */
export default function AkceSmlouvy({
  id,
  clientId,
  ukonceno,
  lzeUkoncit = true,
}: {
  id: string
  clientId: string
  ukonceno?: string
  /** Starší návrhy ve starém tvaru jde jen smazat. */
  lzeUkoncit?: boolean
}) {
  const router = useRouter()
  const uid = useId()
  const [datum, setDatum] = useState(dnes)
  const [potvrzeni, setPotvrzeni] = useState(false)
  const [pracuje, setPracuje] = useState<'ukoncit' | 'smazat' | null>(null)
  const [chyba, setChyba] = useState<string | null>(null)

  async function zavolej(metoda: 'PATCH' | 'DELETE', telo: Record<string, unknown>, akce: 'ukoncit' | 'smazat') {
    setPracuje(akce)
    setChyba(null)
    const res = await fetch('/api/advisor/smlouvy', {
      method: metoda,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...telo }),
    })
    const payload = await res.json().catch(() => ({}))
    setPracuje(null)
    if (!res.ok) {
      setChyba(payload.error ?? 'Změnu se nepodařilo uložit.')
      return false
    }
    return true
  }

  return (
    <div className="space-y-6">
      {lzeUkoncit && (
        <section aria-labelledby={`${uid}-ukonceni`} className="rounded-card border border-line bg-surface p-6">
          <h2 id={`${uid}-ukonceni`} className="font-display text-navy text-lead">
            {ukonceno ? 'Smlouva je ukončená' : 'Ukončit smlouvu'}
          </h2>
          {ukonceno ? (
            <>
              <p className="mt-2 text-base text-slate text-pretty">
                Ukončená od {formatDate(ukonceno)}. Klient ji vidí se štítkem „Ukončená“ a do plateb se nepočítá.
              </p>
              <Button
                type="button"
                variant="outline"
                className="mt-4"
                disabled={pracuje !== null}
                onClick={async () => {
                  if (await zavolej('PATCH', { ukonceno: null }, 'ukoncit')) router.refresh()
                }}
              >
                {pracuje === 'ukoncit' && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />}
                Obnovit smlouvu
              </Button>
            </>
          ) : (
            <>
              <p className="mt-2 text-base text-slate text-pretty">
                Třeba po výpovědi. Klientovi zůstane v přehledu se štítkem „Ukončená“ a přestane se počítat do plateb.
              </p>
              <div className="mt-4 flex flex-wrap items-end gap-3">
                <div>
                  <label htmlFor={`${uid}-datum`} className="block text-sm font-medium text-slate mb-1.5">
                    Ukončena ke dni
                  </label>
                  <Input id={`${uid}-datum`} type="date" value={datum} onChange={(e) => setDatum(e.target.value)} className="w-44" />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  disabled={pracuje !== null || !datum}
                  onClick={async () => {
                    if (await zavolej('PATCH', { ukonceno: datum }, 'ukoncit')) router.refresh()
                  }}
                >
                  {pracuje === 'ukoncit' && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />}
                  Ukončit smlouvu
                </Button>
              </div>
            </>
          )}
        </section>
      )}

      <section aria-labelledby={`${uid}-smazani`} className="rounded-card border border-danger/30 bg-surface p-6">
        <h2 id={`${uid}-smazani`} className="font-display text-navy text-lead">
          Smazat smlouvu
        </h2>
        <p className="mt-2 text-base text-slate text-pretty">
          Smlouva zmizí klientovi i vám, včetně nahraného PDF. Vrátit to nejde – pokud smlouva jen skončila,
          ukončete ji.
        </p>
        {potvrzeni ? (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="text-base font-medium text-navy">Opravdu smazat?</span>
            <Button
              type="button"
              variant="destructive"
              disabled={pracuje !== null}
              onClick={async () => {
                if (await zavolej('DELETE', {}, 'smazat')) {
                  router.push(`/advisor/${clientId}`)
                  router.refresh()
                }
              }}
            >
              {pracuje === 'smazat' && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />}
              Ano, smazat
            </Button>
            <Button type="button" variant="outline" disabled={pracuje !== null} onClick={() => setPotvrzeni(false)}>
              Ne, nechat
            </Button>
          </div>
        ) : (
          <Button type="button" variant="outline" className="mt-4" onClick={() => setPotvrzeni(true)}>
            Smazat smlouvu
          </Button>
        )}
      </section>

      {chyba && (
        <p role="alert" className="rounded-card border border-danger/30 bg-danger/10 p-3 text-base text-danger">
          {chyba}
        </p>
      )}
    </div>
  )
}
