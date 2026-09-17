import Link from 'next/link'
import { BARVY } from '@/lib/barvy'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="bg-surface rounded-card border border-line shadow-sm p-8 text-center max-w-md">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: BARVY.navy }}
        >
          <span className="text-2xl font-bold text-white">404</span>
        </div>
        <h2 className="text-xl font-semibold mb-2" style={{ color: BARVY.navy }}>
          Stránka nenalezena
        </h2>
        <p className="text-base text-slate mb-6">
          Stránka, kterou hledáte, neexistuje nebo byla přesunuta.
        </p>
        <Link
          href="/"
          className="inline-block px-5 py-2.5 text-white text-base font-medium rounded-card hover:opacity-90 transition-opacity"
          style={{ backgroundColor: BARVY.mint }}
        >
          Zpět na úvod
        </Link>
      </div>
    </div>
  )
}
