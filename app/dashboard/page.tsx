import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ArrowRight, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { mesicniPlatby } from '@/lib/payments'
import { proposalTypeLabel, osloveni } from '@/lib/utils'
import { kotvaSmlouvy, spolecnostSmlouvy } from '@/lib/smlouvy'
import PotrebujuVyresit from '@/components/dashboard/PotrebujuVyresit'
import LogoFirmy from '@/components/partneri/LogoFirmy'
import { IKONA_DRUHU } from '@/components/products/ikony'
import type { Proposal } from '@/lib/types/database'

/** Číslo v korunách. Bez desetinných míst — v přehledu jde o řád, ne o haléře. */
function czk(hodnota: number) {
  return `${Math.round(hodnota).toLocaleString('cs-CZ')} Kč`
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: navrhy }, { data: finance }, { count: pocetVariant }] =
    await Promise.all([
      supabase.from('profiles').select('full_name, onboarding_completed').eq('id', user.id).single(),
      supabase
        .from('proposals')
        .select('*')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false }),
      // select('*') schválně: sloupce pro úsporu a rezervu doplní migrace,
      // do té doby se prostě nenačtou a dlaždice ukáže pomlčku.
      supabase.from('client_financials').select('*').eq('client_id', user.id).maybeSingle(),
      supabase
        .from('plan_variants')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', user.id),
    ])

  // Bez jména jen „Dobrý den.“ – „Dobrý den, Klient.“ by nebylo ani oslovení.
  const osloveniKlienta = profile?.full_name ? osloveni(profile.full_name) : null
  const smlouvy = (navrhy ?? []) as Proposal[]
  const { celkem } = mesicniPlatby(smlouvy)
  const maPlan = (pocetVariant ?? 0) > 0

  const uspora = (finance as { possible_savings?: number | null } | null)?.possible_savings ?? null
  const rezerva = (finance as { reserve?: number | null } | null)?.reserve ?? null

  const stav = !profile?.onboarding_completed
    ? 'Začněte vyplněním analýzy. Zabere to kolem patnácti minut a nemusíte ji vyplnit najednou.'
    : maPlan
      ? 'Váš finanční plán je připravený. Můžete si ho projít a dát mi vědět, co vás zajímá.'
      : 'Analýzu mám. Připravuju vám návrh a ozvu se do 48 hodin.'

  const dlazdice = [
    {
      popisek: 'Měsíčně platíte',
      hodnota: celkem > 0 ? czk(celkem) : '–',
      // Smlouva bez zapsané platby není „žádná smlouva“ – pod dlaždicí je přece vypsaná.
      poznamka: celkem > 0 ? 'Součet za všechny smlouvy' : smlouvy.length > 0 ? 'Platby doplním ke smlouvám' : 'Zatím žádná smlouva',
    },
    { popisek: 'Možná úspora', hodnota: uspora ? czk(uspora) : '–', poznamka: uspora ? 'Měsíčně, podle návrhu' : 'Doplním po analýze' },
    { popisek: 'Rezerva', hodnota: rezerva ? czk(rezerva) : '–', poznamka: rezerva ? 'Doporučená výše' : 'Doplním po analýze' },
  ]

  return (
    <div>
      <h1 className="font-display text-h2 text-navy">Dobrý den{osloveniKlienta ? `, ${osloveniKlienta}` : ''}.</h1>
      <p className="mt-3 text-lead text-slate max-w-2xl text-pretty">{stav}</p>

      {!profile?.onboarding_completed && (
        <Link href="/dashboard/analyza" className={`${buttonVariants({ size: 'lg' })} mt-6`}>
          Vyplnit analýzu <ArrowRight className="w-4 h-4" aria-hidden />
        </Link>
      )}

      <div className="mt-10 grid gap-5 sm:grid-cols-3">
        {dlazdice.map((d) => (
          <Card key={d.popisek} className="p-6">
            <p className="text-base text-slate">{d.popisek}</p>
            <p className="font-display text-navy text-3xl mt-2 tabular-nums">{d.hodnota}</p>
            <p className="text-base text-slate mt-1">{d.poznamka}</p>
          </Card>
        ))}
      </div>

      <section className="mt-10">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-h3 text-navy">Vaše smlouvy</h2>
          {smlouvy.length > 0 && (
            <Link
              href="/dashboard/produkty"
              className="text-base text-navy underline underline-offset-4 hover:text-mint-dark rounded-pill focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40"
            >
              Zobrazit vše
            </Link>
          )}
        </div>

        <Card className="mt-5 divide-y divide-line overflow-hidden">
          {smlouvy.length === 0 ? (
            <p className="p-6 text-base text-slate">
              Zatím tu nic není. Jakmile pro vás něco sjednám, najdete to tady i s platbami.
            </p>
          ) : (
            smlouvy.slice(0, 5).map((s) => {
              const spolecnost = spolecnostSmlouvy(s.content)
              const Ikona = IKONA_DRUHU[s.type] ?? IKONA_DRUHU.insurance
              return (
                // Celý řádek vede na detail té smlouvy, ne jen na seznam – tam se rovnou otevře.
                <Link
                  key={s.id}
                  href={`/dashboard/produkty#${kotvaSmlouvy(s.id)}`}
                  className="group p-5 flex items-center justify-between gap-4 transition-colors hover:bg-cream/60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-mint/40"
                >
                  <span className="flex items-center gap-4 min-w-0">
                    {/* Na telefonu bez loga: vedle štítku a šipky by na název zbylo pár slov na řádek. */}
                    <LogoFirmy
                      firma={[spolecnost, s.title]}
                      nahrada={<Ikona className="w-5 h-5 text-slate" strokeWidth={1.8} />}
                      className="hidden sm:flex"
                    />
                    <span className="min-w-0">
                      {/* Zalomit, ne uříznout: vedle štítku a šipky by na telefonu zbylo „Životní poj…“. */}
                      <span className="block text-base font-medium text-navy text-pretty">{s.title}</span>
                      <span className="block text-base text-slate mt-0.5">
                        {proposalTypeLabel(s.type)}
                        {spolecnost && ` · ${spolecnost}`}
                      </span>
                    </span>
                  </span>
                  <span className="shrink-0 flex items-center gap-3">
                    <span
                      className={`rounded-pill px-3 py-1 text-base whitespace-nowrap ${
                        s.is_read ? 'bg-mint/15 text-navy' : 'bg-amber/25 text-navy'
                      }`}
                    >
                      {s.is_read ? 'Aktivní' : 'Ke kontrole'}
                    </span>
                    <ChevronRight
                      aria-hidden
                      strokeWidth={1.8}
                      className="w-5 h-5 text-slate transition-transform group-hover:translate-x-0.5 group-hover:text-navy"
                    />
                  </span>
                </Link>
              )
            })
          )}
        </Card>
      </section>

      <div className="mt-10">
        <PotrebujuVyresit clientId={user.id} />
      </div>
    </div>
  )
}
