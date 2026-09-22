import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/dashboard/Sidebar'
import ChatFab from '@/components/dashboard/ChatFab'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { count: neprectene }] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user.id).single(),
    supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('client_id', user.id)
      .eq('sender_role', 'advisor')
      .eq('is_read', false),
  ])

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Klient'

  return (
    <div className="min-h-screen bg-cream">
      <Sidebar firstName={firstName} neprectene={neprectene ?? 0} />
      <div className="lg:pl-64 obsah-dashboardu">
        {/* Spodní odsazení na mobilu drží obsah nad lištou s navigací */}
        <main className="mx-auto w-full max-w-6xl px-6 py-8 md:py-12 pb-28 lg:pb-12">{children}</main>
      </div>
      <ChatFab />
    </div>
  )
}
