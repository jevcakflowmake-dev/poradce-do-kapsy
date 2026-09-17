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
      className={`relative bg-surface rounded-card border border-line p-6 md:p-8 shadow-card ${className ?? ''}`}
    >
      {(title || subtitle) && (
        <div className="mb-6">
          {title && (
            <h2 className="font-display text-h3 text-navy">
              {title}
            </h2>
          )}
          {subtitle && <p className="text-base text-slate mt-1.5">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  )
}
