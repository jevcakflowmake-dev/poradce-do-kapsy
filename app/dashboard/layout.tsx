import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Klient'

  return (
    <div className="min-h-screen bg-[#F6F4EE]">
      <nav className="bg-[#FDFCF8] border-b border-[#E4DFD2] px-6 md:px-10 lg:px-16 xl:px-20 py-4 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#162459] flex items-end justify-end p-1.5">
              <span className="block w-1.5 h-1.5 rounded-full bg-[#009EE2]" />
            </div>
            <span className="font-bold text-[#162459] hidden sm:block text-lg tracking-tight">
              Poradce do kapsy
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm"
              style={{ background: '#162459' }}
            >
              {firstName[0].toUpperCase()}
            </div>
            <span className="text-sm font-medium text-[#162459] hidden sm:block">{firstName}</span>
            <form action="/api/auth/signout" method="POST">
              <button className="text-[#66708C] hover:text-[#162459] transition-colors p-1" aria-label="Odhlásit">
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
