import Link from 'next/link'
import { Shield } from 'lucide-react'
import type { ReactNode } from 'react'

type Props = {
  eyebrow: string
  numeral: string
  title: ReactNode
  subtitle?: ReactNode
  children: ReactNode
  aside?: ReactNode
}

export default function AuthShell({ eyebrow, numeral, title, subtitle, children, aside }: Props) {
  return (
    <div className="min-h-screen bg-[#f8f9fc] flex flex-col lg:flex-row">
      {/* Brand panel — desktop only as side */}
      <aside
        className="relative lg:w-[44%] xl:w-[40%] overflow-hidden lg:min-h-screen"
        style={{
          background:
            'linear-gradient(160deg, #0e1a3d 0%, #162459 45%, #243471 85%)',
        }}
      >
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(600px circle at 20% 15%, rgba(0,158,226,0.22), transparent 55%), radial-gradient(500px circle at 85% 85%, rgba(0,158,226,0.12), transparent 60%)',
          }}
        />
        <div className="noise-overlay" aria-hidden />

        <div className="relative z-10 flex flex-col justify-between h-full p-8 md:p-12 lg:p-14">
          <Link href="/" className="inline-flex items-center gap-2.5 group w-fit">
            <div className="w-9 h-9 rounded-xl bg-[#009EE2] flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" strokeWidth={1.8} />
            </div>
            <span className="font-bold text-white text-lg tracking-tight">
              Poradce do kapsy
            </span>
          </Link>

          <div className="py-12 lg:py-0">
            <div
              className="font-display italic text-[#009EE2]/70 mb-4"
              style={{ fontSize: 'clamp(3rem, 6vw, 5.5rem)', letterSpacing: '-0.04em', lineHeight: 0.9 }}
            >
              {numeral}
            </div>
            <p className="text-xs tracking-[0.3em] uppercase text-[#009EE2]/70 mb-3">{eyebrow}</p>
            <h1
              className="font-display text-white mb-4"
              style={{
                fontSize: 'clamp(2.25rem, 5vw, 4rem)',
                letterSpacing: '-0.03em',
                lineHeight: 1.02,
              }}
            >
              {title}
            </h1>
            {subtitle && <p className="text-white/55 leading-relaxed max-w-sm">{subtitle}</p>}
          </div>

          <div className="text-xs text-white/40 tracking-wider">
            {aside ?? 'Certifikovaný poradce · ProfiFP / OVB Allfinanz'}
          </div>
        </div>
      </aside>

      {/* Form column */}
      <main className="flex-1 flex items-center justify-center p-6 md:p-10 lg:p-14">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  )
}
