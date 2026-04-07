export default function AdvisorLoading() {
  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-4xl mx-auto">
          <div className="h-5 w-40 bg-slate-200 rounded animate-pulse" />
        </div>
      </nav>
      <div className="max-w-4xl mx-auto p-4">
        <div className="h-8 w-32 bg-slate-200 rounded animate-pulse mb-6" />
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="px-4 py-4 border-b border-slate-100 flex gap-4">
              <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
              <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
              <div className="h-4 w-16 bg-slate-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
