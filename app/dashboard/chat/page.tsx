import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ChatWindow from '@/components/chat/ChatWindow'

export default async function ClientChatPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed')
    .eq('id', user.id)
    .single()

  if (!profile?.onboarding_completed) redirect('/onboarding')

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-120px)] bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Chat header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3" style={{ background: 'linear-gradient(135deg, #0f2d52, #1a4170)' }}>
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
          P
        </div>
        <div>
          <div className="font-semibold text-white text-sm">Váš finanční poradce</div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
            <span className="text-xs text-blue-200">Odpovídá do 24 hodin</span>
          </div>
        </div>
      </div>

      <ChatWindow
        clientId={user.id}
        myRole="client"
        advisorName="Váš poradce"
      />
    </div>
  )
}
