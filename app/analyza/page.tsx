import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PublicAnalysisForm from './PublicAnalysisForm'

export const metadata: Metadata = {
  title: 'Finanční analýza zdarma',
  description:
    'Vyplňte analýzu své finanční situace — bez registrace, bez schůzky. Do 48 hodin dostanete osobní návrh pojištění, spoření nebo investic.',
  alternates: { canonical: '/analyza' },
}

export default async function PublicAnalysisPage() {
  // Přihlášený člověk nemá vyplňovat anonymní formulář — ve svém dashboardu
  // má stejnou analýzu s automatickým ukládáním a historií příloh.
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const role = user.user_metadata?.role
    redirect(role === 'advisor' ? '/advisor' : '/dashboard/analyza')
  }

  return <PublicAnalysisForm />
}
