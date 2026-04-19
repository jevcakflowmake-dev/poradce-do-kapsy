import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center max-w-md">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: '#162459' }}
        >
          <span className="text-2xl font-bold text-white">404</span>
        </div>
        <h2 className="text-xl font-semibold mb-2" style={{ color: '#162459' }}>
          Stránka nenalezena
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          Stránka, kterou hledáte, neexistuje nebo byla přesunuta.
        </p>
        <Link
          href="/"
          className="inline-block px-5 py-2.5 text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity"
          style={{ backgroundColor: '#009EE2' }}
        >
          Zpět na úvod
        </Link>
      </div>
    </div>
  )
}
