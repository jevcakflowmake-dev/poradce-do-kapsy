import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import ChatWindow from '@/components/chat/ChatWindow'
import type { Profile } from '@/lib/types/database'

export const dynamic = 'force-dynamic'

export default async function KlientChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()
  const { data } = await supabase.from('profiles').select('*').eq('id', id).single()
  if (!data) notFound()
  const _profile = data as Profile

  return (
    <div className="max-w-5xl mx-auto px-6 md:px-10 lg:px-16 xl:px-20 py-10 md:py-14">
      <Link
        href={`/klient/${id}`}
        className="inline-flex items-center gap-1 text-sm text-[#818EAF] hover:text-[#162459] transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Zpět
      </Link>

      <div className="mb-6">
        <div className="section-numeral text-[3rem] md:text-[4rem] mb-2">05</div>
        <p className="text-xs tracking-[0.3em] uppercase text-[#818EAF] mb-2">Chat · přímo na poradce</p>
        <h1
          className="font-display text-[#162459]"
          style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', letterSpacing: '-0.02em', lineHeight: 1.05 }}
        >
          Napište <span style={{ fontStyle: 'italic', color: '#009EE2' }}>poradci</span>
        </h1>
      </div>

      <div
        className="flex flex-col bg-white rounded-3xl border border-[#E8E9EE] overflow-hidden shadow-[0_10px_30px_-10px_rgba(22,36,89,0.1)]"
        style={{ height: 'calc(100vh - 320px)', minHeight: 500 }}
      >
        <div
          className="relative px-6 py-5 border-b border-white/10 flex items-center gap-3 overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #0e1a3d, #162459 55%, #243471)' }}
        >
          <div className="noise-overlay" aria-hidden />
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(400px circle at 90% 50%, rgba(0,158,226,0.2), transparent 55%)' }}
          />
          <div
            className="relative z-10 w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #009EE2, #0088c6)' }}
          >
            P
          </div>
          <div className="relative z-10">
            <div className="font-display text-white" style={{ fontSize: '0.95rem', letterSpacing: '-0.01em' }}>
              Váš finanční poradce
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a] animate-pulse" />
              <span className="text-xs text-white/55">Odpovídá do 24 hodin</span>
            </div>
          </div>
        </div>
        <ChatWindow clientId={id} myRole="client" advisorName="Váš poradce" />
      </div>
    </div>
  )
}
