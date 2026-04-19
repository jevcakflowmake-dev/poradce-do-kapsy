import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-100 px-4 py-3 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Link href={`/advisor/${clientId}`} className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, #009EE2, #0088c6)', color: '#162459' }}>
            {(profile.full_name || 'K')[0].toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-slate-900 text-sm">{profile.full_name || 'Klient'}</div>
            <div className="text-xs text-slate-400">Chat s klientem</div>
          </div>
        </div>
      </nav>

      {/* Chat */}
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-4 flex flex-col" style={{ height: 'calc(100vh - 65px)' }}>
        <div className="flex-1 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <ChatWindow
            clientId={clientId}
            myRole="advisor"
            advisorName={profile.full_name ?? 'Klient'}
          />
        </div>
      </div>
    </div>
  )
}
