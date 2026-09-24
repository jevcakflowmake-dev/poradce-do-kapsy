'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { BARVY } from '@/lib/barvy'

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  // Detail chyby jen do konzole – na obrazovku jde český text níž.
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="bg-surface rounded-card border border-line shadow-sm p-8 text-center max-w-md">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: BARVY.navy }}
        >
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold mb-2" style={{ color: BARVY.navy }}>
          Něco se pokazilo
        </h2>
        {/* Vlastní text, ne error.message: v produkci je to obecná anglická
            hláška Next.js nebo prohlížeče, klientovi by nic neřekla. */}
        <p className="text-base text-slate mb-6">Nastala neočekávaná chyba. Zkuste to prosím znovu.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {/* retry (Next 16.3) data znovu načte; reset by jen překreslil totéž. */}
          <button
            onClick={() => retry()}
            className="px-5 py-2.5 text-white text-base font-medium rounded-card hover:opacity-90 transition-opacity"
            style={{ backgroundColor: BARVY.mint }}
          >
            Zkusit znovu
          </button>
          <Link
            href="/"
            className="px-5 py-2.5 text-base font-medium rounded-card border border-line hover:bg-cream transition-colors"
            style={{ color: BARVY.navy }}
          >
            Zpět na úvod
          </Link>
        </div>
      </div>
    </div>
  )
}
