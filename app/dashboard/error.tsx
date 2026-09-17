'use client'

import Link from 'next/link'
import { BARVY } from '@/lib/barvy'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="bg-surface rounded-card border border-line shadow-sm p-8 text-center max-w-sm">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: BARVY.navy }}
        >
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold mb-2" style={{ color: BARVY.navy }}>
          Něco se pokazilo
        </h2>
        <p className="text-sm text-slate mb-5">
          {error.message || 'Zkuste stránku znovu načíst.'}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 text-white text-sm font-medium rounded-card hover:opacity-90 transition-opacity"
            style={{ backgroundColor: BARVY.mint }}
          >
            Zkusit znovu
          </button>
          <Link
            href="/"
            className="px-4 py-2 text-sm font-medium rounded-card border border-line hover:bg-cream transition-colors"
            style={{ color: BARVY.navy }}
          >
            Zpět na úvod
          </Link>
        </div>
      </div>
    </div>
  )
}
