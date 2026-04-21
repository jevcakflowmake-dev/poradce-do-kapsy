'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import { CLIENT_STATUS_VALUES, CLIENT_STATUS_META } from '@/lib/utils'

type Props = {
  counts: Record<string, number>
  total: number
}

export default function StatusFilter({ counts, total }: Props) {
  const router = useRouter()
  const params = useSearchParams()
  const active = params.get('status')
  const [pending, startTransition] = useTransition()

  const setStatus = (s: string | null) => {
    const next = new URLSearchParams(Array.from(params.entries()))
    if (s) next.set('status', s)
    else next.delete('status')
    const qs = next.toString()
    startTransition(() => router.push(qs ? `/advisor?${qs}` : '/advisor'))
  }

  const Chip = ({
    label,
    value,
    count,
    style,
  }: {
    label: string
    value: string | null
    count: number
    style?: React.CSSProperties
  }) => {
    const isActive = active === value || (active === null && value === null)
    return (
      <button
        type="button"
        onClick={() => setStatus(value)}
        disabled={pending}
        className={`group inline-flex items-center gap-2 px-3.5 py-2 rounded-full border text-xs md:text-sm font-medium transition-all ${
          isActive
            ? 'shadow-[0_0_0_1px_rgba(0,158,226,0.3)] scale-[1.02]'
            : 'hover:scale-[1.02]'
        }`}
        style={
          isActive
            ? {
                background: style?.background ?? 'rgba(22,36,89,0.06)',
                borderColor: style?.borderColor ?? '#162459',
                color: style?.color ?? '#162459',
              }
            : {
                background: 'white',
                borderColor: '#E8E9EE',
                color: '#162459',
              }
        }
      >
        {style?.background && (
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: style.color as string }}
          />
        )}
        <span>{label}</span>
        <span
          className="tabular-nums text-[11px] px-1.5 py-0.5 rounded-full"
          style={{
            background: isActive ? 'rgba(255,255,255,0.5)' : '#f1f5f9',
            color: isActive ? (style?.color as string) ?? '#162459' : '#64748b',
          }}
        >
          {count}
        </span>
      </button>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2 md:gap-3">
      <Chip label="Vše" value={null} count={total} />
      {CLIENT_STATUS_VALUES.map((s) => {
        const meta = CLIENT_STATUS_META[s]
        return (
          <Chip
            key={s}
            label={meta.label}
            value={s}
            count={counts[s] ?? 0}
            style={{
              background: meta.bg,
              borderColor: meta.border as string,
              color: meta.text,
            }}
          />
        )
      })}
    </div>
  )
}
