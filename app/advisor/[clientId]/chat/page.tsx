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

  // Výška okna, ne min-height: u `min-h-screen` nemá kontejner určitou výšku,
  // takže `flex-1` uvnitř se počítá z obsahu. Při delší konverzaci pak karta
  // naroste přes celou stránku a pole pro psaní skončí až úplně dole.
  return (
    <div className="h-dvh bg-[#F6F4EE] flex flex-col">
      {/* Navbar */}
      <nav className="shrink-0 bg-[#FDFCF8] border-b border-[#E4DFD2] px-6 md:px-10 lg:px-16 xl:px-20 py-4">
        <div className="max-w-8xl mx-auto flex items-center gap-3">
          <Link
            href={`/advisor/${clientId}`}
            className="inline-flex items-center gap-1 text-[#66708C] hover:text-[#162459] transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Zpět na detail</span>
          </Link>
          <div className="h-6 w-px bg-[#E4DFD2] mx-1 hidden sm:block" />
          <div
            className="w-9 h-9 rounded-none flex items-center justify-center text-sm font-bold text-white"
            style={{ background: '#162459' }}
          >
            {(profile.full_name || 'K')[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-[#162459] text-sm truncate">{profile.full_name || 'Klient'}</div>
            <div className="text-xs text-[#66708C]">Chat s klientem</div>
          </div>
        </div>
      </nav>

      {/* Chat vyplní zbytek okna; min-h-0 pustí scrollování dovnitř seznamu zpráv */}
      <div className="flex-1 min-h-0 max-w-shell mx-auto w-full px-6 md:px-10 lg:px-16 xl:px-20 py-6 flex flex-col">
        <div className="flex-1 min-h-0 bg-[#FDFCF8] rounded-none border border-[#E4DFD2] overflow-hidden flex flex-col shadow-[0_10px_30px_-10px_rgba(22,36,89,0.08)]">
          <ChatWindow clientId={clientId} myRole="advisor" />
        </div>
      </div>
    </div>
  )
}
