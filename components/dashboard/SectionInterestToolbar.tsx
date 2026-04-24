'use client'

import { useState } from 'react'
import { Check, HelpCircle, Clock, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export type InterestStatus = 'interested' | 'question' | 'not_now' | null

type Props = {
  clientId: string
  section: string
  sectionLabel: string
  status: InterestStatus
  onStatusChange: (next: InterestStatus) => void
  onAskQuestion: () => void
}

const WEBHOOK_URL = 'https://n8n.jevcakn8n.com/webhook/klient-zajem'

export default function SectionInterestToolbar({
  clientId,
  section,
  sectionLabel,
  status,
  onStatusChange,
  onAskQuestion,
}: Props) {
  const [loading, setLoading] = useState<InterestStatus>(null)

  async function setStatus(next: Exclude<InterestStatus, 'question' | null>) {
    if (loading) return
    const previous = status
    setLoading(next)
    onStatusChange(next) // optimistic

    const supabase = createClient()
    const { error } = await (supabase.from('plan_section_interest') as any).upsert(
      {
        client_id: clientId,
        section,
        status: next,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'client_id,section' },
    )

    if (error) {
      onStatusChange(previous) // rollback
      setLoading(null)
      return
    }

    // Webhook — jen u "interested", "not_now" jde do daily digest
    if (next === 'interested') {
      try {
        fetch(WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'section_interest',
            client_id: clientId,
            section,
            section_label: sectionLabel,
            status: next,
            created_at: new Date().toISOString(),
          }),
        })
      } catch {}
    }

    setLoading(null)
  }

  return (
    <div className="flex flex-wrap items-center gap-2 pt-4 mt-4 border-t border-[#E8E9EE]">
      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#818EAF] mr-1">
        Vaše reakce:
      </span>

      <Btn
        active={status === 'interested'}
        loading={loading === 'interested'}
        tone="positive"
        onClick={() => setStatus('interested')}
        icon={<Check className="w-3.5 h-3.5" strokeWidth={2.2} />}
      >
        Mám zájem
      </Btn>

      <Btn
        active={status === 'question'}
        loading={false}
        tone="neutral"
        onClick={onAskQuestion}
        icon={<HelpCircle className="w-3.5 h-3.5" strokeWidth={2} />}
      >
        Zeptat se
      </Btn>

      <Btn
        active={status === 'not_now'}
        loading={loading === 'not_now'}
        tone="muted"
        onClick={() => setStatus('not_now')}
        icon={<Clock className="w-3.5 h-3.5" strokeWidth={2} />}
      >
        Zatím ne
      </Btn>
    </div>
  )
}

function Btn({
  children,
  active,
  loading,
  tone,
  onClick,
  icon,
}: {
  children: React.ReactNode
  active: boolean
  loading: boolean
  tone: 'positive' | 'neutral' | 'muted'
  onClick: () => void
  icon: React.ReactNode
}) {
  const base =
    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all disabled:opacity-50 border'
  const tones: Record<typeof tone, { active: string; inactive: string }> = {
    positive: {
      active: 'bg-[#009EE2] text-white border-[#009EE2] shadow-sm shadow-[#009EE2]/25',
      inactive: 'bg-white text-[#0088c6] border-[#009EE2]/30 hover:border-[#009EE2] hover:bg-[#009EE2]/5',
    },
    neutral: {
      active: 'bg-[#162459] text-white border-[#162459]',
      inactive: 'bg-white text-[#162459] border-[#E8E9EE] hover:border-[#162459]/40',
    },
    muted: {
      active: 'bg-[#818EAF]/15 text-[#818EAF] border-[#818EAF]/30',
      inactive: 'bg-white text-[#818EAF] border-[#E8E9EE] hover:border-[#818EAF]/50',
    },
  }
  const state = active ? tones[tone].active : tones[tone].inactive

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`${base} ${state}`}
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : icon}
      {children}
    </button>
  )
}
