import { Card } from '@/components/ui/card'
import PoslatOdkaz from '@/components/dashboard/PoslatOdkaz'
import { ODMENA_KC } from '@/lib/doporuceni'
import { plural } from '@/lib/utils'

export interface SouhrnBodu {
  ceka: number
  kProplaceni: { pocet: number; kc: number }
  vyplaceno: { pocet: number; kc: number }
}

const kc = (n: number) => `${n.toLocaleString('cs-CZ')} Kč`
const bodu = (n: number) => `${n} ${plural(n, 'bod', 'body', 'bodů')}`

/**
 * Věrnostní body za doporučení v přehledu klienta (lib/doporuceni.ts).
 * Jen počty – kdo koho doporučil a kdo má jakou smlouvu, klient nevidí.
 * Že se bod doporučiteli připíše, ví doporučený z nápovědy u otázky
 * „Kdo vám mě doporučil?“ v analýze.
 */
export default function VernostniBody({ souhrn, odkaz }: { souhrn: SouhrnBodu; odkaz: string }) {
  const maBody = souhrn.ceka + souhrn.kProplaceni.pocet + souhrn.vyplaceno.pocet > 0
  const polozky = [
    { popisek: 'Čeká na smlouvu', hodnota: bodu(souhrn.ceka), pozn: null },
    { popisek: 'K proplacení', hodnota: bodu(souhrn.kProplaceni.pocet), pozn: souhrn.kProplaceni.kc > 0 ? kc(souhrn.kProplaceni.kc) : null },
    { popisek: 'Vyplaceno', hodnota: bodu(souhrn.vyplaceno.pocet), pozn: souhrn.vyplaceno.kc > 0 ? kc(souhrn.vyplaceno.kc) : null },
  ]

  return (
    <section className="mt-10">
      <h2 className="font-display text-h3 text-navy">Doporučte mě známým</h2>
      <Card className="mt-5 p-6 md:p-7">
        <p className="text-base text-navy max-w-2xl text-pretty">
          Za každého, koho mi doporučíte a kdo u mě uzavře smlouvu, dostanete věrnostní bod: poukázku
          v&nbsp;hodnotě {kc(ODMENA_KC)}. Stačí, když při vyplňování analýzy napíše do kolonky „Kdo vám mě
          doporučil?“ vaše jméno a&nbsp;příjmení.
        </p>
        <PoslatOdkaz odkaz={odkaz} />

        {maBody && (
          <>
            <dl className="mt-6 pt-5 border-t border-line grid gap-4 sm:grid-cols-3">
              {polozky.map((p) => (
                <div key={p.popisek} className="flex flex-col">
                  <dt className="order-2 text-base text-slate">
                    {p.popisek}
                    {p.pozn && ` · ${p.pozn}`}
                  </dt>
                  <dd className="order-1 font-display text-navy text-2xl tabular-nums">{p.hodnota}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-base text-slate text-pretty">
              Bod se ukáže, jakmile doporučený vyplní analýzu. Poukázku vám pošlu, až uzavře smlouvu.
            </p>
          </>
        )}
      </Card>
    </section>
  )
}
