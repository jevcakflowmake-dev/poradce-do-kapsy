import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Info } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import SmlouvaZVariantyForm from '@/components/advisor/SmlouvaZVariantyForm'
import KrytiPojistky from '@/components/pojisteni/KrytiPojistky'
import { ctiProdukt } from '@/lib/produkt-varianty'
import { krytiZVarianty } from '@/lib/smlouva-z-varianty'
import { FREKVENCE_PLATEB, TYP_SMLOUVY_PODLE_SEKCE, castkaZTextu, ctiSmlouvu } from '@/lib/smlouvy'

/**
 * Převod vybrané varianty plánu na smlouvu v Moje smlouvy klienta.
 * Vlevo co poradce doplní po podpisu, vpravo co se převezme z varianty.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function SmlouvaZVariantyPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string }>
  searchParams: Promise<{ varianta?: string }>
}) {
  const { clientId } = await params
  const { varianta: variantaId } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.app_metadata?.role !== 'advisor') return redirect('/dashboard')
  if (!variantaId || !UUID.test(variantaId)) return notFound()

  const [{ data: profil }, { data: varianta }, { data: smlouvy }] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', clientId).maybeSingle(),
    supabase
      .from('plan_variants')
      .select('id, client_id, section, company, monthly_payment, details')
      .eq('id', variantaId)
      .maybeSingle(),
    supabase.from('proposals').select('id, title, content').eq('client_id', clientId),
  ])
  if (!profil || !varianta || varianta.client_id !== clientId) return notFound()

  const jmeno = profil.full_name || 'Klient'
  const typ = TYP_SMLOUVY_PODLE_SEKCE[varianta.section]
  const produkt = ctiProdukt(varianta.details)
  const kryti = varianta.section === 'income' ? krytiZVarianty(varianta.details) : undefined
  const existujici = (smlouvy ?? []).find((s) => ctiSmlouvu(s.content)?.zVarianty === varianta.id)
  const frekvence =
    FREKVENCE_PLATEB.find((f) => f.toLowerCase() === produkt?.frekvence?.trim().toLowerCase()) ?? 'Měsíčně'
  // Cena varianty je měsíční; předvyplnit dává smysl jen u měsíční platby.
  const castka = frekvence === 'Měsíčně' ? castkaZTextu(varianta.monthly_payment) : null
  const nazevProduktu = produkt?.nazev ?? varianta.company
  const vychoziNazev = varianta.section === 'income' ? `Životní pojištění ${nazevProduktu}` : nazevProduktu

  const prevzate = [
    ['Pojišťovna/společnost', varianta.company],
    ['Produkt', produkt?.nazev],
    ['Běží do', produkt?.doVeku],
    ['Hlášení pojistné události', produkt?.hlaseni],
    ['Platby a změny', produkt?.kontakt],
  ].filter((r): r is [string, string] => Boolean(r[1]))

  return (
    <div className="min-h-screen bg-cream">
      <nav className="bg-surface border-b border-line px-6 md:px-10 lg:px-16 xl:px-20 py-4 sticky top-0 z-30">
        <div className="max-w-8xl mx-auto flex items-center gap-3">
          <Link
            href={`/advisor/${clientId}`}
            className="inline-flex items-center gap-1 text-slate hover:text-navy transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Detail</span>
          </Link>
          <div className="h-6 w-px bg-line mx-1 hidden sm:block" />
          <span className="font-semibold text-navy flex-1 truncate">{jmeno} · Smlouva z varianty</span>
        </div>
      </nav>

      <div className="max-w-shell mx-auto px-6 md:px-10 lg:px-16 xl:px-20 py-10 md:py-14">
        <header className="mb-8">
          <p className="text-xs tracking-[0.3em] uppercase text-slate mb-2">Klient vybral · {varianta.company}</p>
          <h1 className="font-display text-navy text-h2">Převést na smlouvu</h1>
          <p className="text-slate mt-3 max-w-2xl leading-relaxed text-pretty">
            Doplňte, co vzniklo podpisem – číslo smlouvy a platbu. Zbytek se vezme z varianty a klient
            smlouvu uvidí v sekci Moje smlouvy popsanou stejně, jako ji znal z plánu.
          </p>
        </header>

        {!typ ? (
          <p className="rounded-card border border-line bg-surface p-6 text-base text-slate max-w-2xl">
            Z oblasti Bydlení smlouvu převést nejde – hypotéka v sekci Moje smlouvy zatím nemá své místo.
          </p>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] items-start">
            <section aria-labelledby="doplnit" className="rounded-card border border-line bg-surface p-6 md:p-8">
              <h2 id="doplnit" className="font-display text-navy text-h3 mb-5">
                Údaje ze smlouvy
              </h2>
              {existujici && (
                <p className="mb-5 flex gap-2.5 rounded-card border border-amber/40 bg-amber/15 p-3 text-base text-navy text-pretty">
                  <Info className="w-5 h-5 shrink-0 mt-0.5" aria-hidden />
                  Z této varianty už smlouva existuje („{existujici.title}“). Uložením vznikne další.
                </p>
              )}
              <SmlouvaZVariantyForm
                clientId={clientId}
                variantId={varianta.id}
                vychozi={{ title: vychoziNazev, typ, frekvence, castka }}
              />
            </section>

            <section aria-labelledby="prevezme" className="space-y-5">
              <div className="rounded-card border border-line bg-surface p-6 md:p-8">
                <h2 id="prevezme" className="font-display text-navy text-h3">
                  Převezme se z varianty
                </h2>
                <dl className="mt-4 space-y-2">
                  {prevzate.map(([popisek, hodnota]) => (
                    <div key={popisek} className="flex flex-wrap gap-x-3">
                      <dt className="text-base text-slate">{popisek}</dt>
                      <dd className="text-base text-navy break-all">{hodnota}</dd>
                    </div>
                  ))}
                </dl>
                {produkt?.popis && <p className="mt-4 text-base text-slate text-pretty">{produkt.popis}</p>}
                <p className="mt-4 text-sm text-slate text-pretty">
                  Chcete něco změnit? Upravte variantu v plánu, převede se aktuální stav.
                </p>
              </div>
            </section>
          </div>
        )}

        {/* Krytí přes celou šířku: karty po skupinách se do bočního sloupce nevejdou. */}
        {typ && kryti && (
          <div className="mt-8">
            <KrytiPojistky
              castky={kryti}
              titulek="Sjednané krytí"
              podtitulek="Převezme se z varianty – klient ho uvidí u smlouvy přesně takhle."
              zvyraznit
            />
          </div>
        )}
      </div>
    </div>
  )
}
