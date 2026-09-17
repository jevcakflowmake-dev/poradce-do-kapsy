import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ChatWindow from '@/components/chat/ChatWindow'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { BARVY } from '@/lib/barvy'

export const dynamic = 'force-dynamic'

export default async function ClientChatPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="max-w-shell mx-auto px-6 md:px-10 lg:px-16 xl:px-20 py-10 md:py-14">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-slate hover:text-navy transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Zpět
      </Link>

      <div className="mb-6">
        <p className="text-xs tracking-[0.3em] uppercase text-slate mb-2">Chat · přímo na poradce</p>
        <h1
          className="font-display text-navy"
          style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', letterSpacing: '-0.02em', lineHeight: 1.05 }}
        >
          Napište <span style={{ color: BARVY.mint }}>poradci</span>
        </h1>
      </div>

      <div className="flex flex-col h-[calc(100vh-320px)] min-h-[500px] bg-surface rounded-card border border-line overflow-hidden shadow-[0_10px_30px_-10px_rgba(22,36,89,0.1)]">
        <div
          className="relative px-6 py-5 border-b border-white/10 flex items-center gap-3 overflow-hidden"
          style={{ background: BARVY.navyDeep }}
        >
          <div
            className="relative z-10 w-11 h-11 rounded-card flex items-center justify-center text-sm font-bold text-white"
            style={{ background: BARVY.navy }}
          >
            P
          </div>
          <div className="relative z-10">
            <div className="font-display text-white" style={{ fontSize: '0.95rem', letterSpacing: '-0.01em' }}>
              Váš finanční poradce
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-mint animate-pulse" />
              <span className="text-xs text-white/55">Odpovídá do 24 hodin</span>
            </div>
          </div>
        </div>
        <ChatWindow clientId={user.id} myRole="client" />
      </div>
    </div>
  )
}
