'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, Check } from 'lucide-react'
import {
  CLIENT_STATUS_META,
  CLIENT_STATUS_VALUES,
  type ClientStatusValue,
} from '@/lib/utils'

type Props = {
  clientId: string
  initial: string
}

export default function StatusControl({ clientId, initial }: Props) {
  const [value, setValue] = useState<ClientStatusValue>(
    (initial as ClientStatusValue) in CLIENT_STATUS_META
      ? (initial as ClientStatusValue)
      : 'novy',
  )
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  const meta = CLIENT_STATUS_META[value]

  const change = async (next: ClientStatusValue) => {
    setError(null)
    const prev = value
    setValue(next)
    setOpen(false)
    const res = await fetch('/api/advisor/client-status', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, status: next }),
    })
    if (!res.ok) {
      setValue(prev)
      const body = await res.json().catch(() => null)
      setError(body?.error ?? 'Uložení se nepovedlo')
      return
    }
    startTransition(() => router.refresh())
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={pending}
        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full border text-sm font-medium transition-all hover:shadow-sm"
        style={{
          background: meta.bg,
          borderColor: meta.border,
          color: meta.text,
        }}
      >
        <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: meta.dot }} />
        {meta.label}
        <ChevronDown className="w-3.5 h-3.5 opacity-60" />
      </button>

      {open && (
        <div
          className="absolute z-20 mt-2 min-w-[220px] right-0 bg-white border border-[#E8E9EE] rounded-2xl shadow-xl p-1.5"
          role="listbox"
        >
          {CLIENT_STATUS_VALUES.map((s) => {
            const m = CLIENT_STATUS_META[s]
            const isActive = s === value
            return (
              <button
                key={s}
                type="button"
                onClick={() => change(s)}
                className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl hover:bg-[#f8f9fc] text-left"
              >
                <span className="flex items-center gap-2 text-sm text-[#162459]">
                  <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: m.dot }} />
                  {m.label}
                </span>
                {isActive && <Check className="w-4 h-4 text-[#009EE2]" />}
              </button>
            )
          })}
        </div>
      )}

      {error && (
        <div className="absolute left-0 mt-2 text-xs text-[#c2410c] bg-[rgba(234,88,12,0.08)] border border-[rgba(234,88,12,0.3)] rounded-lg px-2.5 py-1.5 whitespace-nowrap">
          {error}
        </div>
      )}
    </div>
  )
}
