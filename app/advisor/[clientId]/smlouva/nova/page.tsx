import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import HlavickaPodstranky from '@/components/advisor/HlavickaPodstranky'
import SmlouvaForm from '@/components/advisor/SmlouvaForm'

/**
 * Ručně zadaná smlouva – třeba ta, kterou klient už má odjinud, nebo sjednaná
 * mimo plán. Smlouvu z vybrané varianty převádí stránka ../smlouva?varianta=.
 */
export default async function NovaSmlouvaPage({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.app_metadata?.role !== 'advisor') return redirect('/dashboard')

  const { data: profil } = await supabase.from('profiles').select('full_name').eq('id', clientId).maybeSingle()
  if (!profil) return notFound()
  const jmeno = profil.full_name || 'Klient'

  return (
    <div className="min-h-screen bg-cream">
      <HlavickaPodstranky clientId={clientId} jmeno={jmeno} nazev="Nová smlouva" />
      <div className="max-w-shell mx-auto px-6 md:px-10 lg:px-16 xl:px-20 py-10 md:py-14">
        <header className="mb-8">
          <p className="text-xs tracking-[0.3em] uppercase text-slate mb-2">Smlouvy · ručně</p>
          <h1 className="font-display text-navy text-h2">Přidat smlouvu</h1>
          <p className="text-slate mt-3 max-w-2xl leading-relaxed text-pretty">
            Klient ji uvidí v sekci Moje smlouvy s platbou, QR kódem a kontakty a přijde mu o ní e-mail.
            Smlouvu z varianty, kterou si klient vybral v plánu, převedete z detailu klienta.
          </p>
        </header>
        <div className="max-w-3xl rounded-card border border-line bg-surface p-6 md:p-8">
          <SmlouvaForm clientId={clientId} />
        </div>
      </div>
    </div>
  )
}
