'use client'

import { useState } from 'react'
import type { Proposal } from '@/lib/types/database'
import { plural } from '@/lib/utils'
import ProposalCard from './ProposalCard'

export default function ProposalList({ proposals }: { proposals: Proposal[] }) {
  const [list, setList] = useState(proposals)

  if (list.length === 0) {
    return (
      <div className="bg-surface rounded-card border border-line p-8 text-center">
        <div className="text-4xl mb-3">📭</div>
        <p className="text-slate font-medium">Zatím žádné návrhy</p>
        <p className="text-slate text-sm mt-1">Poradce vám návrhy zašle do 48 hodin</p>
      </div>
    )
  }

  const unread = list.filter(p => !p.is_read).length

  return (
    <div className="space-y-2">
      {unread > 0 && (
        <p className="text-sm text-navy font-medium">
          {unread} {plural(unread, 'nepřečtený návrh', 'nepřečtené návrhy', 'nepřečtených návrhů')}
        </p>
      )}
      {list.map(p => (
        <ProposalCard
          key={p.id}
          proposal={p}
          onRead={() => setList(l => l.map(x => x.id === p.id ? { ...x, is_read: true } : x))}
        />
      ))}
    </div>
  )
}
