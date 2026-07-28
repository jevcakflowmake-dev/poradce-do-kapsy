'use client'

import Link from 'next/link'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen bg-[#F6F4EE] flex items-center justify-center p-4">
      <div className="bg-[#FDFCF8] rounded-none border border-[#E4DFD2] shadow-sm p-8 text-center max-w-sm">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: '#162459' }}
        >
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold mb-2" style={{ color: '#162459' }}>
          Něco se pokazilo
        </h2>
        <p className="text-sm text-[#66708C] mb-5">
          {error.message || 'Zkuste stránku znovu načíst.'}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 text-white text-sm font-medium rounded-none hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#009EE2' }}
          >
            Zkusit znovu
          </button>
          <Link
            href="/"
            className="px-4 py-2 text-sm font-medium rounded-none border border-[#E4DFD2] hover:bg-[#F6F4EE] transition-colors"
            style={{ color: '#162459' }}
          >
            Zpět na úvod
          </Link>
        </div>
      </div>
    </div>
  )
}
