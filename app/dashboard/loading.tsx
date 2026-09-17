export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-cream">
      <nav className="bg-surface border-b border-line px-4 py-3">
        <div className="max-w-2xl mx-auto">
          <div className="h-5 w-40 bg-line rounded animate-pulse" />
        </div>
      </nav>
      <div className="max-w-2xl mx-auto p-4 space-y-5">
        <div className="h-8 w-48 bg-line rounded animate-pulse" />
        <div className="h-28 bg-line rounded-card animate-pulse" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-line rounded-card animate-pulse" />
          ))}
        </div>
        <div className="h-40 bg-line rounded-card animate-pulse" />
      </div>
    </div>
  )
}
