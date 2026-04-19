import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import ChatWindow from '@/components/chat/ChatWindow'
import type { Profile } from '@/lib/types/database'

export const dynamic = 'force-dynamic'

export default async function KlientChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()
  const { data } = await supabase.from('profiles').select('*').eq('id', id).single()
  if (!data) notFound()
  const profile = data as Profile

  return (
    <div className="w-full container px-4 mx-auto max-w-4xl py-8">
      <Link
        href={`/klient/${id}`}
        className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900 transition-colors mb-4"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Zpět
      </Link>

      <div
        className="flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
        style={{ height: 'calc(100vh - 200px)' }}
      >
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3" style={{ background: 'linear-gradient(135deg, #162459, #243471)' }}>
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold text-white">
            P
          </div>
          <div>
            <div className="font-semibold text-white text-sm">Váš finanční poradce</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
              <span className="text-xs text-white/50">Odpovídá do 24 hodin</span>
            </div>
          </div>
        </div>
        <ChatWindow clientId={id} myRole="client" advisorName="Váš poradce" />
      </div>
    </div>
  )
}
