import { CLIENT_STATUS_META, type ClientStatusValue } from '@/lib/utils'

type Props = {
  value: string | null | undefined
  size?: 'sm' | 'md'
}

export default function StatusBadge({ value, size = 'sm' }: Props) {
  const key = (value ?? 'novy') as ClientStatusValue
  const meta = CLIENT_STATUS_META[key] ?? CLIENT_STATUS_META.novy

  const pad = size === 'md' ? 'px-3 py-1.5 text-[13px]' : 'px-2.5 py-1 text-xs'

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium border ${pad} whitespace-nowrap`}
      style={{
        background: meta.bg,
        borderColor: meta.border,
        color: meta.text,
      }}
    >
      <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: meta.dot }} />
      {meta.label}
    </span>
  )
}
