'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Proposal } from '@/lib/types/database'
import { proposalTypeLabel, formatDate } from '@/lib/utils'
import { BARVY } from '@/lib/barvy'

/** Typ návrhu odlišuje plocha, ne vlastní barva — paleta má jen navy, mint a amber. */
const TYPE_TRIDY: Record<string, string> = {
  insurance: 'bg-navy/8 text-navy',
  pension: 'bg-mint/15 text-navy',
  invest: 'bg-amber/25 text-navy',
}

export default function ProposalCard({ proposal, onRead }: { proposal: Proposal; onRead?: () => void }) {
  const [read, setRead] = useState(proposal.is_read)
  const [expanded, setExpanded] = useState(false)
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const sbRef = useRef<ReturnType<typeof createClient> | null>(null)
  const getSupabase = () => { if (!sbRef.current) sbRef.current = createClient(); return sbRef.current }

  // file_url je storage cesta v privátním bucketu – signed URL řešíme
  // až při rozbalení karty (starší záznamy s plným http URL pustíme rovnou)
  useEffect(() => {
    if (!expanded || !proposal.file_url || fileUrl) return
    if (proposal.file_url.startsWith('http')) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- starší záznam má rovnou veřejnou adresu, není co podepisovat
      setFileUrl(proposal.file_url)
      return
    }
    getSupabase()
      .storage.from('proposals')
      .createSignedUrl(proposal.file_url, 60 * 60)
      .then(({ data }) => { if (data?.signedUrl) setFileUrl(data.signedUrl) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded, proposal.file_url])

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

  const stylTypu = TYPE_TRIDY[proposal.type] ?? 'bg-cream-deep text-navy'

  return (
    <div
      className={`rounded-card border transition-all cursor-pointer ${
        read ? 'border-line bg-surface' : 'border-mint/30 bg-mint/5'
      }`}
      onClick={handleClick}
    >
      <div className="p-4 flex items-start gap-3">
        {!read && <span className="w-2 h-2 rounded-full bg-mint mt-2 shrink-0" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-pill ${stylTypu}`}>
              {proposalTypeLabel(proposal.type)}
            </span>
            <span className="text-xs text-slate">{formatDate(proposal.created_at)}</span>
          </div>
          <div className="font-semibold text-navy mt-1.5 text-sm">{proposal.title}</div>
        </div>
        <svg
          className={`w-4 h-4 text-slate-soft shrink-0 mt-1 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-line pt-3 space-y-3" onClick={e => e.stopPropagation()}>
          {proposal.content && (
            <p className="text-sm text-navy whitespace-pre-wrap leading-relaxed">{proposal.content}</p>
          )}
          {proposal.file_url && !fileUrl && (
            <p className="text-xs text-slate">Načítám přílohu…</p>
          )}
          {proposal.file_url && fileUrl && (
            <div>
              <p className="text-xs font-medium text-slate mb-2 uppercase tracking-wide">Příloha PDF</p>
              <iframe src={fileUrl} className="w-full h-64 rounded-card border border-line" title={proposal.title} />
              <a href={fileUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-2 text-sm font-medium" style={{ color: BARVY.navy }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
                Stáhnout PDF
              </a>
            </div>
          )}
          {proposal.link_url && (
            <a href={proposal.link_url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: BARVY.navy }}>
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
