export default function AdvisorLoading() {
  return (
    <div className="min-h-screen bg-[#F6F4EE]">
      <nav className="border-b border-[#E4DFD2] px-4 py-3" style={{ backgroundColor: '#162459' }}>
        <div className="max-w-4xl mx-auto">
          <div className="h-5 w-40 rounded animate-pulse" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }} />
        </div>
      </nav>
      <div className="max-w-4xl mx-auto p-4">
        <div className="h-8 w-32 bg-[#E4DFD2] rounded animate-pulse mb-6" />
        <div className="bg-[#FDFCF8] rounded-none border border-[#E4DFD2] overflow-hidden">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="px-4 py-4 border-b border-[#EFEBE0] flex gap-4">
              <div className="h-4 w-32 bg-[#E4DFD2] rounded animate-pulse" />
              <div className="h-4 w-24 bg-[#E4DFD2] rounded animate-pulse" />
              <div className="h-4 w-16 bg-[#E4DFD2] rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
