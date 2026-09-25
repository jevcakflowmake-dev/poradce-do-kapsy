import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import NovyKlientForm from '@/components/advisor/NovyKlientForm'

/** Ruční založení klienta, který se do aplikace sám neregistroval. */
export default async function NovyKlientPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.app_metadata?.role !== 'advisor') return redirect('/dashboard')

  return (
    <div className="min-h-screen bg-cream">
      <nav className="bg-surface border-b border-line px-6 md:px-10 lg:px-16 xl:px-20 py-4 sticky top-0 z-30">
        <div className="max-w-8xl mx-auto flex items-center gap-3">
          <Link
            href="/advisor"
            className="inline-flex items-center gap-1 text-slate hover:text-navy transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden />
            <span className="hidden sm:inline">Klienti</span>
            <span className="sr-only sm:hidden">Zpět na seznam klientů</span>
          </Link>
          <div className="h-6 w-px bg-line mx-1 hidden sm:block" />
          <span className="font-semibold text-navy flex-1 truncate">Nový klient</span>
        </div>
      </nav>
      <div className="max-w-shell mx-auto px-6 md:px-10 lg:px-16 xl:px-20 py-10 md:py-14">
        <header className="mb-8">
          <p className="text-xs tracking-[0.3em] uppercase text-slate mb-2">Klienti · ručně</p>
          <h1 className="font-display text-navy text-h2">Přidat klienta</h1>
          <p className="text-slate mt-3 max-w-2xl leading-relaxed text-pretty">
            Pro klienty, kteří se do aplikace sami neregistrovali. Založíte jim účet a můžete rovnou připravit plán
            nebo přidat smlouvy. Klientovi nic nepřijde, dokud mu nepošlete pozvánku – hned tady, nebo později
            z jeho detailu.
          </p>
        </header>
        <div className="max-w-xl rounded-card border border-line bg-surface p-6 md:p-8">
          <NovyKlientForm />
        </div>
      </div>
    </div>
  )
}
