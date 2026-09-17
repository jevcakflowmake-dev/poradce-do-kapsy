import { BARVY } from '@/lib/barvy'

export default function AdvisorLoading() {
  return (
    <div className="min-h-screen bg-cream">
      <nav className="border-b border-line px-4 py-3" style={{ backgroundColor: BARVY.navy }}>
        <div className="max-w-4xl mx-auto">
          <div className="h-5 w-40 rounded animate-pulse" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }} />
        </div>
      </nav>
      <div className="max-w-4xl mx-auto p-4">
        <div className="h-8 w-32 bg-line rounded animate-pulse mb-6" />
        <div className="bg-surface rounded-card border border-line overflow-hidden">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="px-4 py-4 border-b border-line flex gap-4">
              <div className="h-4 w-32 bg-line rounded animate-pulse" />
              <div className="h-4 w-24 bg-line rounded animate-pulse" />
              <div className="h-4 w-16 bg-line rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
