import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import HlavickaPodstranky from '@/components/advisor/HlavickaPodstranky'
import SmlouvaForm from '@/components/advisor/SmlouvaForm'
import AkceSmlouvy from '@/components/advisor/AkceSmlouvy'
import { FREKVENCE_PLATEB, ctiSmlouvu, type TypSmlouvy } from '@/lib/smlouvy'

/** Úprava, ukončení a smazání smlouvy klienta. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function UpravaSmlouvyPage({
  params,
}: {
  params: Promise<{ clientId: string; smlouvaId: string }>
}) {
  const { clientId, smlouvaId } = await params
  if (!UUID.test(smlouvaId)) return notFound()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.app_metadata?.role !== 'advisor') return redirect('/dashboard')

  const [{ data: profil }, { data: radek }] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', clientId).maybeSingle(),
    supabase
      .from('proposals')
      .select('id, client_id, type, title, content, file_url, link_url')
      .eq('id', smlouvaId)
      .maybeSingle(),
  ])
  if (!profil || !radek || radek.client_id !== clientId) return notFound()

  const jmeno = profil.full_name || 'Klient'
  const obsah = ctiSmlouvu(radek.content)
  const frekvence = FREKVENCE_PLATEB.find((f) => f === obsah?.frekvence) ?? 'Měsíčně'

  return (
    <div className="min-h-screen bg-cream">
      <HlavickaPodstranky clientId={clientId} jmeno={jmeno} nazev="Smlouva" />
      <div className="max-w-shell mx-auto px-6 md:px-10 lg:px-16 xl:px-20 py-10 md:py-14">
        <header className="mb-8">
          <p className="text-xs tracking-[0.3em] uppercase text-slate mb-2">
            Smlouvy · {obsah?.zVarianty ? 'převedená z plánu' : 'úprava'}
          </p>
          <h1 className="font-display text-navy text-h2 text-balance">{radek.title}</h1>
          {obsah?.zVarianty && (
            <p className="text-slate mt-3 max-w-2xl leading-relaxed text-pretty">
              Produkt a krytí jsou převzaté z varianty {obsah.spolecnost ? `${obsah.spolecnost} ` : ''}v plánu. Tady
              upravíte, co vzniklo podpisem – číslo smlouvy, platbu, počátek a PDF.
            </p>
          )}
        </header>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] items-start">
          <div className="rounded-card border border-line bg-surface p-6 md:p-8">
            {obsah ? (
              <SmlouvaForm
                clientId={clientId}
                smlouva={{
                  id: radek.id,
                  title: radek.title,
                  typ: radek.type as TypSmlouvy,
                  zVarianty: Boolean(obsah.zVarianty),
                  spolecnost: obsah.spolecnost,
                  produkt: obsah.produkt,
                  popis: obsah.popis,
                  doVeku: obsah.doVeku,
                  hlaseni: obsah.hlaseni,
                  kontakt: obsah.kontakt,
                  cisloSmlouvy: obsah.cisloSmlouvy,
                  pocatek: obsah.pocatek,
                  castka: obsah.platba?.castka ?? null,
                  frekvence,
                  ucet: obsah.platba?.ucet,
                  vs: obsah.platba?.vs,
                  zprava: obsah.platba?.zprava,
                  polozkyKryti: obsah.polozkyKryti,
                  fileUrl: radek.file_url,
                  linkUrl: radek.link_url,
                }}
              />
            ) : (
              <p className="text-base text-slate text-pretty">
                Tohle je starší návrh ve starém tvaru a upravit ho nejde. Pokud má zůstat, založte ho znovu jako
                novou smlouvu a tenhle smažte.
              </p>
            )}
          </div>
          <AkceSmlouvy id={radek.id} clientId={clientId} ukonceno={obsah?.ukonceno} lzeUkoncit={Boolean(obsah)} />
        </div>
      </div>
    </div>
  )
}
