'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, Loader2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'

type Akce = 'zverejnit' | 'skryt' | 'upozornit'

/**
 * Stav plánu pro poradce: vidí ho klient? Zveřejnění pošle klientovi e-mail
 * „plán je připravený“; u zveřejněného jde klientovi dát vědět o změnách
 * nebo plán zase skrýt. Náhled ukáže plán přesně tak, jak ho uvidí klient.
 */
export default function ZverejneniPlanu({
  clientId,
  zverejneno: vychozi,
  maObsah,
  naNahledu = false,
}: {
  clientId: string
  zverejneno: string | null
  /** Plán má aspoň variantu nebo doporučení – prázdný zveřejnit nejde. */
  maObsah: boolean
  /** Na stránce náhledu odkaz na náhled nedává smysl. */
  naNahledu?: boolean
}) {
  const router = useRouter()
  const [zverejneno, setZverejneno] = useState(vychozi)
  const [pracuje, setPracuje] = useState<Akce | null>(null)
  const [zprava, setZprava] = useState<{ text: string; chyba?: boolean } | null>(null)

  async function proved(akce: Akce) {
    setPracuje(akce)
    setZprava(null)
    const res = await fetch('/api/advisor/plan/zverejneni', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, akce }),
    })
    const data = await res.json().catch(() => ({}))
    setPracuje(null)
    if (!res.ok) {
      setZprava({ text: data.error ?? 'Změnu se nepodařilo uložit.', chyba: true })
      return
    }
    setZverejneno(data.plan_zverejnen_at ?? null)
    setZprava({
      text:
        akce === 'zverejnit'
          ? 'Plán je zveřejněný a klientovi odchází e-mail.'
          : akce === 'upozornit'
            ? 'Klientovi odchází e-mail, že se plán změnil.'
            : 'Plán je skrytý, klient ho teď nevidí.',
    })
    router.refresh()
  }

  return (
    <div className="rounded-card border border-line bg-surface p-5 md:p-6" aria-live="polite">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-semibold text-navy">
            <span
              aria-hidden
              className={`w-2.5 h-2.5 rounded-pill shrink-0 ${zverejneno ? 'bg-mint' : 'bg-amber'}`}
            />
            {zverejneno ? `Klient plán vidí od ${formatDate(zverejneno)}` : 'Klient plán zatím nevidí'}
          </p>
          <p className="mt-1 text-sm text-slate text-pretty">
            {zverejneno
              ? 'Změny v plánu vidí hned. Když upravíte něco důležitého, dejte mu vědět e-mailem.'
              : maObsah
                ? 'Až bude plán hotový, zveřejněte ho – klientovi přijde e-mail, že je připravený.'
                : 'Přidejte aspoň jednu variantu nebo doporučení, pak půjde plán zveřejnit.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          {!naNahledu && (
            <Link
              href={`/advisor/${clientId}/nahled`}
              className="inline-flex items-center gap-2 h-11 px-5 rounded-pill border border-navy/25 text-navy text-base font-medium transition-colors hover:border-navy hover:bg-navy/5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40"
            >
              <Eye className="w-4 h-4" aria-hidden /> Náhled očima klienta
            </Link>
          )}
          {zverejneno ? (
            <>
              <Button type="button" size="sm" variant="outline" disabled={pracuje !== null} onClick={() => proved('upozornit')}>
                {pracuje === 'upozornit' ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : <Send className="w-4 h-4" aria-hidden />}
                Dát vědět o změnách
              </Button>
              <Button type="button" size="sm" variant="ghost" disabled={pracuje !== null} onClick={() => proved('skryt')}>
                {pracuje === 'skryt' && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />}
                Skrýt plán
              </Button>
            </>
          ) : (
            <Button type="button" size="sm" disabled={pracuje !== null || !maObsah} onClick={() => proved('zverejnit')}>
              {pracuje === 'zverejnit' && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />}
              Zveřejnit plán
            </Button>
          )}
        </div>
      </div>
      {zprava && (
        <p role={zprava.chyba ? 'alert' : 'status'} className={`mt-3 text-sm ${zprava.chyba ? 'text-danger' : 'text-navy'}`}>
          {zprava.text}
        </p>
      )}
    </div>
  )
}
