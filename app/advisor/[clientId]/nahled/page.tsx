import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import HlavickaPodstranky from '@/components/advisor/HlavickaPodstranky'
import ZverejneniPlanu from '@/components/advisor/ZverejneniPlanu'
import FinancniPlan from '@/components/dashboard/FinancniPlan'

/**
 * Náhled finančního plánu očima klienta – stejná komponenta, jakou vidí
 * klient, jen bez výběru a reakcí. Funguje i u plánu, který klient ještě
 * nevidí, takže si ho poradce před zveřejněním projde celý.
 */
export default async function NahledPlanuPage({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.app_metadata?.role !== 'advisor') return redirect('/dashboard')

  const [{ data: profil }, { count: variant }, { count: doporuceni }] = await Promise.all([
    supabase.from('profiles').select('full_name, plan_zverejnen_at').eq('id', clientId).maybeSingle(),
    supabase.from('plan_variants').select('id', { count: 'exact', head: true }).eq('client_id', clientId),
    supabase.from('plan_recommendations').select('id', { count: 'exact', head: true }).eq('client_id', clientId),
  ])
  if (!profil) return notFound()

  return (
    <div className="min-h-screen bg-cream">
      <HlavickaPodstranky clientId={clientId} jmeno={profil.full_name || 'Klient'} nazev="Náhled plánu" />
      <div className="mx-auto w-full max-w-6xl px-6 py-8 md:py-12">
        <div className="bez-tisku mb-10">
          <ZverejneniPlanu
            clientId={clientId}
            zverejneno={profil.plan_zverejnen_at}
            maObsah={Boolean(variant || doporuceni)}
            naNahledu
          />
        </div>
        <FinancniPlan klientId={clientId} nahled />
      </div>
    </div>
  )
}
