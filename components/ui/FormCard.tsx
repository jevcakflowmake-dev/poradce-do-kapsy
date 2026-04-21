import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
  title?: ReactNode
  subtitle?: ReactNode
  className?: string
}

export default function FormCard({ children, title, subtitle, className }: Props) {
  return (
    <div
      className={`relative bg-white rounded-3xl border border-[#E8E9EE] p-6 md:p-8 shadow-[0_1px_0_rgba(22,36,89,0.03)] ${className ?? ''}`}
    >
      {(title || subtitle) && (
        <div className="mb-6">
          {title && (
            <h2
              className="font-display text-[#162459]"
              style={{ fontSize: '1.25rem', letterSpacing: '-0.01em' }}
            >
              {title}
            </h2>
          )}
          {subtitle && <p className="text-sm text-[#818EAF] mt-1.5">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  )
}
