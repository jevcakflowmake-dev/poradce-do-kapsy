'use client'

import { useId, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const normalizuj = (t: string) =>
  t.normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/\s+/g, ' ').trim().toLowerCase()

/**
 * Smazání klienta se vším, co k němu v aplikaci je – pro žádost o výmaz
 * údajů (GDPR). Nevratné, proto se potvrzuje napsáním jména; diakritika
 * a velikost písmen se nekontrolují, ať to jde napsat i na telefonu.
 */
export default function SmazaniKlienta({ clientId, potvrzovaciText }: { clientId: string; potvrzovaciText: string }) {
  const router = useRouter()
  const uid = useId()
  const [otevreno, setOtevreno] = useState(false)
  const [napsano, setNapsano] = useState('')
  const [pracuje, setPracuje] = useState(false)
  const [chyba, setChyba] = useState<string | null>(null)
  const sedi = normalizuj(napsano) === normalizuj(potvrzovaciText)

  async function smazat() {
    setPracuje(true)
    setChyba(null)
    try {
      const res = await fetch('/api/advisor/klienti', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId }),
      })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) {
        setChyba(payload.error ?? 'Klienta se nepodařilo smazat.')
        setPracuje(false)
        return
      }
      router.push('/advisor')
      router.refresh()
    } catch {
      setChyba('Chyba připojení. Zkuste to prosím znovu.')
      setPracuje(false)
    }
  }

  return (
    <section aria-labelledby={`${uid}-nadpis`} className="rounded-card border border-danger/30 bg-surface p-6 md:p-7">
      <h2 id={`${uid}-nadpis`} className="font-display text-navy text-h3">
        Smazat klienta
      </h2>
      <p className="mt-2 max-w-2xl text-base text-slate text-pretty">
        Smaže účet klienta i všechno, co k němu v aplikaci je: analýzu a nahrané dokumenty, finanční plán, smlouvy
        s PDF, chat i vaše poznámky. Hodí se, když klient požádá o výmaz údajů. Vrátit to nejde – pokud klient
        jen odešel, nastavte mu nahoře stav Archiv.
      </p>

      {otevreno ? (
        <div className="mt-5 max-w-md space-y-3">
          <label htmlFor={`${uid}-potvrzeni`} className="block text-base text-navy">
            Pro potvrzení napište <strong className="font-semibold">{potvrzovaciText}</strong>
          </label>
          <Input
            id={`${uid}-potvrzeni`}
            value={napsano}
            onChange={(e) => setNapsano(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="destructive" disabled={!sedi || pracuje} onClick={smazat}>
              {pracuje && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />}
              Smazat natrvalo
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={pracuje}
              onClick={() => {
                setOtevreno(false)
                setNapsano('')
              }}
            >
              Nechat klienta
            </Button>
          </div>
        </div>
      ) : (
        <Button type="button" variant="outline" className="mt-5" onClick={() => setOtevreno(true)}>
          Smazat klienta…
        </Button>
      )}

      {chyba && (
        <p role="alert" className="mt-4 rounded-card border border-danger/30 bg-danger/10 p-3 text-base text-danger">
          {chyba}
        </p>
      )}
    </section>
  )
}
