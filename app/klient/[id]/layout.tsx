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
    <div className="min-h-screen bg-[#f8f9fc]">
      <nav className="bg-white border-b border-[#E8E9EE] px-6 md:px-10 lg:px-16 xl:px-20 py-4 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <a href={`/klient/${id}`} className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#162459]">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="font-bold text-[#162459] hidden sm:block text-lg tracking-tight">
              Poradce do kapsy
            </span>
          </a>
          <div className="flex items-center gap-4">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm"
              style={{ background: 'linear-gradient(135deg, #009EE2, #0088c6)' }}
            >
              {firstName[0].toUpperCase()}
            </div>
            <span className="text-sm font-medium text-[#162459] hidden sm:block">{firstName}</span>
            <form action="/api/auth/signout" method="POST">
              <button
                className="text-[#818EAF] hover:text-[#162459] transition-colors p-1 ml-1"
                title="Odhlásit se"
                aria-label="Odhlásit"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  )
}
