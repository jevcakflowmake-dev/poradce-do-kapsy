'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import { CLIENT_STATUS_VALUES, CLIENT_STATUS_META } from '@/lib/utils'
import { BARVY } from '@/lib/barvy'

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

  return (
    <div className="flex flex-wrap items-center gap-2 md:gap-3">
      <Chip
        label="Vše"
        value={null}
        count={total}
        isActive={active === null}
        disabled={pending}
        onSelect={setStatus}
      />
      {CLIENT_STATUS_VALUES.map((s) => {
        const meta = CLIENT_STATUS_META[s]
        return (
          <Chip
            key={s}
            label={meta.label}
            value={s}
            count={counts[s] ?? 0}
            isActive={active === s}
            disabled={pending}
            onSelect={setStatus}
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

// Mimo komponentu schválně: definice uvnitř renderu vzniká pokaždé znovu,
// takže by React chipy při každém překreslení odmountoval a ztratil jejich stav.
function Chip({
  label,
  value,
  count,
  style,
  isActive,
  disabled,
  onSelect,
}: {
  label: string
  value: string | null
  count: number
  style?: React.CSSProperties
  isActive: boolean
  disabled: boolean
  onSelect: (value: string | null) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      disabled={disabled}
      className={`group inline-flex items-center gap-2 px-3.5 py-2 rounded-full border text-xs md:text-sm font-medium transition-all ${
        isActive
          ? 'ring-1 ring-mint/30 scale-[1.02]'
          : 'hover:scale-[1.02]'
      }`}
      style={
        isActive
          ? {
              background: style?.background ?? 'rgba(15,42,68,0.06)',
              borderColor: style?.borderColor ?? BARVY.navy,
              color: style?.color ?? BARVY.navy,
            }
          : {
              background: 'white',
              borderColor: BARVY.line,
              color: BARVY.navy,
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
          background: isActive ? 'rgba(255,255,255,0.5)' : BARVY.line,
          color: isActive ? (style?.color as string) ?? BARVY.navy : BARVY.slate,
        }}
      >
        {count}
      </span>
    </button>
  )
}
