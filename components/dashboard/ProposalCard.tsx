'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Proposal } from '@/lib/types/database'
import { proposalTypeLabel, formatDate } from '@/lib/utils'

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  insurance: { bg: '#eff6ff', text: '#1e40af' },
  pension: { bg: '#f5f3ff', text: '#6d28d9' },
  invest: { bg: '#ecfdf5', text: '#065f46' },
}

export default function ProposalCard({ proposal, onRead }: { proposal: Proposal; onRead?: () => void }) {
  const [read, setRead] = useState(proposal.is_read)
  const [expanded, setExpanded] = useState(false)
  const sbRef = useRef<ReturnType<typeof createClient> | null>(null)
  const getSupabase = () => { if (!sbRef.current) sbRef.current = createClient(); return sbRef.current }

  async function markRead() {
    if (read) return
    setRead(true)
    await getSupabase().from('proposals').update({ is_read: true }).eq('id', proposal.id)
    onRead?.()
  }

  function handleClick() {
    setExpanded(e => !e)
    markRead()
  }

  const colors = TYPE_COLORS[proposal.type] ?? { bg: '#f8fafc', text: '#475569' }

  return (
    <div
      className={`rounded-xl border transition-all cursor-pointer ${
        read ? 'border-slate-100 bg-white' : 'border-blue-200 bg-blue-50/50'
      }`}
      onClick={handleClick}
    >
      <div className="p-4 flex items-start gap-3">
        {!read && <span className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full" style={{ background: colors.bg, color: colors.text }}>
              {proposalTypeLabel(proposal.type)}
            </span>
            <span className="text-xs text-slate-400">{formatDate(proposal.created_at)}</span>
          </div>
          <div className="font-semibold text-slate-800 mt-1.5 text-sm">{proposal.title}</div>
        </div>
        <svg
          className={`w-4 h-4 text-slate-300 shrink-0 mt-1 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-100 pt-3 space-y-3" onClick={e => e.stopPropagation()}>
          {proposal.content && (
            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{proposal.content}</p>
          )}
          {proposal.file_url && (
            <div>
              <p className="text-xs font-medium text-slate-400 mb-2 uppercase tracking-wide">Příloha PDF</p>
              <iframe src={proposal.file_url} className="w-full h-64 rounded-xl border border-slate-100" title={proposal.title} />
              <a href={proposal.file_url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-2 text-sm font-medium" style={{ color: '#162459' }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
                Stáhnout PDF
              </a>
            </div>
          )}
          {proposal.link_url && (
            <a href={proposal.link_url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: '#162459' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Otevřít odkaz
            </a>
          )}
        </div>
      )}
    </div>
  )
}
