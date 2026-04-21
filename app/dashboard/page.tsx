import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ClientHome from '@/components/dashboard/ClientHome'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Klient'

  return <ClientHome firstName={firstName} />
}
