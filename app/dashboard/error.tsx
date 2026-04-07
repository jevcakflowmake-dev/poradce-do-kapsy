'use client'

export default function DashboardError({ reset }: { reset: () => void }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-sm">
        <div className="text-4xl mb-3">⚠️</div>
        <h2 className="font-semibold text-slate-900 mb-2">Něco se pokazilo</h2>
        <p className="text-sm text-slate-500 mb-4">Zkuste stránku znovu načíst.</p>
        <button
          onClick={reset}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700"
        >
          Zkusit znovu
        </button>
      </div>
    </div>
  )
}
