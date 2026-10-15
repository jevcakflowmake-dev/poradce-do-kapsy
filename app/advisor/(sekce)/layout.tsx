import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/dashboard/Sidebar'
import ZiveZpravy from '@/components/advisor/ZiveZpravy'

/**
 * Rozložení sekcí panelu poradce – Přehled, Klienti, Zprávy – s navigací
 * vlevo (na mobilu dole), stejně jako má klient svou zónu. Detail klienta,
 * plán a smlouvy jsou mimo tuhle skupinu a mají vlastní horní lištu.
 */
export default async function PanelPoradceLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.app_metadata?.role !== 'advisor') redirect('/dashboard')

  const [{ data: profil }, { count: neprectene }] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
    supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('sender_role', 'client')
      .eq('is_read', false),
  ])

  return (
    <div className="min-h-screen bg-cream">
      <Sidebar oblast="poradce" firstName={profil?.full_name?.split(' ')[0] || 'Poradce'} neprectene={neprectene ?? 0} />
      <ZiveZpravy />
      <div className="lg:pl-64">
        {/* Spodní odsazení na mobilu drží obsah nad lištou s navigací */}
        <main className="mx-auto w-full max-w-7xl px-5 md:px-8 lg:px-10 py-8 md:py-12 pb-28 lg:pb-12">{children}</main>
      </div>
    </div>
  )
}
