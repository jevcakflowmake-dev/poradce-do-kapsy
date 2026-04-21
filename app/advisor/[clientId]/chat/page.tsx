import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/types/database'
import ChatWindow from '@/components/chat/ChatWindow'

export default async function AdvisorChatPage({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'advisor') return redirect('/dashboard')

  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', clientId)
    .single()

  if (!profileData) return notFound()

  const profile = profileData as Profile

  return (
    <div className="min-h-screen bg-[#f8f9fc] flex flex-col">
      {/* Navbar */}
      <nav className="bg-white border-b border-[#E8E9EE] px-6 md:px-10 lg:px-16 xl:px-20 py-4 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <Link
            href={`/advisor/${clientId}`}
            className="inline-flex items-center gap-1 text-[#818EAF] hover:text-[#162459] transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Zpět na detail</span>
          </Link>
          <div className="h-6 w-px bg-[#E8E9EE] mx-1 hidden sm:block" />
          <div
            className="w-9 h-9 rounded-2xl flex items-center justify-center text-sm font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #009EE2, #0088c6)' }}
          >
            {(profile.full_name || 'K')[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-[#162459] text-sm truncate">{profile.full_name || 'Klient'}</div>
            <div className="text-xs text-[#818EAF]">Chat s klientem</div>
          </div>
        </div>
      </nav>

      {/* Chat */}
      <div
        className="flex-1 max-w-5xl mx-auto w-full px-6 md:px-10 lg:px-16 xl:px-20 py-6 flex flex-col"
        style={{ height: 'calc(100vh - 73px)' }}
      >
        <div className="flex-1 bg-white rounded-3xl border border-[#E8E9EE] overflow-hidden flex flex-col shadow-[0_10px_30px_-10px_rgba(22,36,89,0.08)]">
          <ChatWindow clientId={clientId} myRole="advisor" advisorName={profile.full_name ?? 'Klient'} />
        </div>
      </div>
    </div>
  )
}
