import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import type { Profile } from '@/lib/types/database'

export const dynamic = 'force-dynamic'

export default async function KlientLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = createAdminClient()
  const { data } = await supabase.from('profiles').select('*').eq('id', id).single()
  if (!data) notFound()
  const profile = data as Profile
  const firstName = (profile.full_name && profile.full_name.length > 0) ? profile.full_name.split(' ')[0] : 'Klient'

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-100 px-4 py-3 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <a href={`/klient/${id}`} className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="font-bold text-slate-900 hidden sm:block text-lg">Poradce do kapsy</span>
          </a>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-sm font-bold text-white shadow-sm">
              {firstName[0].toUpperCase()}
            </div>
            <span className="text-sm font-medium text-slate-700 hidden sm:block">{firstName}</span>
          </div>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  )
}
