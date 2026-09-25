'use client'

import { useId, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Lock, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface Poznamka {
  id: string
  text: string
  created_at: string
}

const MAX_DELKA = 5000

/** S hodinou – proto pevně pražský čas, server na Vercelu běží v UTC. */
function kdyNapsana(iso: string) {
  return new Date(iso).toLocaleString('cs-CZ', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Prague',
  })
}

/**
 * Interní poznámky ke klientovi – co zaznělo na schůzce nebo do telefonu.
 * Klient je nevidí. Nejnovější nahoře; smazání se potvrzuje u poznámky.
 */
export default function PoznamkyKlienta({ clientId, poznamky }: { clientId: string; poznamky: Poznamka[] }) {
  const router = useRouter()
  const uid = useId()
  const [text, setText] = useState('')
  const [uklada, setUklada] = useState(false)
  const [maze, setMaze] = useState<string | null>(null)
  const [potvrdit, setPotvrdit] = useState<string | null>(null)
  const [chyba, setChyba] = useState<string | null>(null)
  // Změna se ukáže hned, ne až po router.refresh(); pak ji převezme výpis ze serveru.
  const [nove, setNove] = useState<Poznamka[]>([])
  const [smazane, setSmazane] = useState<string[]>([])
  const zobrazene = [...nove.filter((n) => !poznamky.some((p) => p.id === n.id)), ...poznamky].filter(
    (p) => !smazane.includes(p.id),
  )

  async function ulozit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    setUklada(true)
    setChyba(null)
    try {
      const res = await fetch('/api/advisor/poznamky', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId, text }),
      })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) {
        setChyba(payload.error ?? 'Poznámku se nepodařilo uložit.')
        return
      }
      setText('')
      if (payload.poznamka) setNove((n) => [payload.poznamka as Poznamka, ...n])
      router.refresh()
    } catch {
      setChyba('Chyba připojení. Zkuste to prosím znovu.')
    } finally {
      setUklada(false)
    }
  }

  async function smazat(id: string) {
    setMaze(id)
    setChyba(null)
    try {
      const res = await fetch('/api/advisor/poznamky', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) {
        setChyba(payload.error ?? 'Poznámku se nepodařilo smazat.')
        return
      }
      setSmazane((s) => [...s, id])
      setPotvrdit(null)
      router.refresh()
    } catch {
      setChyba('Chyba připojení. Zkuste to prosím znovu.')
    } finally {
      setMaze(null)
    }
  }

  return (
    <section aria-labelledby={`${uid}-nadpis`}>
      <div className="mb-5">
        <p className="text-xs tracking-[0.3em] uppercase text-slate mb-1">jen pro vás</p>
        <h2 id={`${uid}-nadpis`} className="font-display text-navy text-h3">
          Poznámky
        </h2>
        <p className="mt-2 flex items-start gap-2 text-base text-slate max-w-2xl">
          <Lock className="w-4 h-4 shrink-0 mt-1" aria-hidden />
          Co zaznělo na schůzce nebo do telefonu. Klient poznámky nevidí.
        </p>
      </div>

      <div className="rounded-card border border-line bg-surface p-5 md:p-6">
        <form onSubmit={ulozit}>
          <label htmlFor={`${uid}-text`} className="sr-only">
            Nová poznámka
          </label>
          <textarea
            id={`${uid}-text`}
            rows={3}
            value={text}
            maxLength={MAX_DELKA}
            onChange={(e) => setText(e.target.value)}
            placeholder="Třeba: v březnu čekají druhé dítě, hypotéku chtějí řešit až po fixaci."
            className="w-full rounded-input border border-line bg-surface px-4 py-3 text-base text-navy placeholder:text-slate transition-colors focus:outline-none focus:border-mint focus:ring-4 focus:ring-mint/20 resize-y"
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <Button type="submit" disabled={uklada || !text.trim()}>
              {uklada && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />}
              Uložit poznámku
            </Button>
            {text.length > MAX_DELKA - 500 && (
              <span className="text-sm text-slate tabular-nums">
                {text.length.toLocaleString('cs-CZ')} / {MAX_DELKA.toLocaleString('cs-CZ')}
              </span>
            )}
          </div>
        </form>

        {chyba && (
          <p role="alert" className="mt-4 rounded-card border border-danger/30 bg-danger/10 p-3 text-base text-danger">
            {chyba}
          </p>
        )}

        {zobrazene.length > 0 && (
          <ul className="mt-6 divide-y divide-line border-t border-line">
            {zobrazene.map((p) => (
              <li key={p.id} className="py-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 text-base text-navy whitespace-pre-line break-words">{p.text}</p>
                  {potvrdit !== p.id && (
                    <button
                      type="button"
                      onClick={() => setPotvrdit(p.id)}
                      className="shrink-0 inline-flex items-center justify-center w-11 h-11 -mt-2 -mr-2 rounded-pill text-slate hover:text-danger hover:bg-danger/10 transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden />
                      <span className="sr-only">Smazat poznámku</span>
                    </button>
                  )}
                </div>
                <p className="mt-1 text-sm text-slate">{kdyNapsana(p.created_at)}</p>
                {potvrdit === p.id && (
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <span className="text-base font-medium text-navy">Smazat poznámku?</span>
                    <Button type="button" variant="destructive" size="sm" disabled={maze !== null} onClick={() => smazat(p.id)}>
                      {maze === p.id && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />}
                      Smazat
                    </Button>
                    <Button type="button" variant="outline" size="sm" disabled={maze !== null} onClick={() => setPotvrdit(null)}>
                      Nechat
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
