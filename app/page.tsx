import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import HeroSection from '@/components/landing/HeroSection'
import StatsBand from '@/components/landing/StatsBand'
import LifePathSection from '@/components/landing/LifePathSection'
import HowItWorksSection from '@/components/landing/HowItWorksSection'
import BenefitsSection from '@/components/landing/BenefitsSection'
import CtaSection from '@/components/landing/CtaSection'
import CursorFollower from '@/components/motion/CursorFollower'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const role = user.user_metadata?.role
    redirect(role === 'advisor' ? '/advisor' : '/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#F6F4EE]">
      <CursorFollower />
      <HeroSection />
      <StatsBand />
      <LifePathSection />
      <HowItWorksSection />
      <BenefitsSection />
      <CtaSection />

      <footer className="relative px-6 md:px-10 lg:px-16 xl:px-20 py-12 border-t border-[#E4DFD2] bg-[#F6F4EE] overflow-hidden">
        <div className="noise-paper" aria-hidden />
        <div className="relative z-10 max-w-7xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-[#162459] flex items-end justify-end p-1.5">
              <span className="block w-1 h-1 rounded-full bg-[#009EE2]" />
            </div>
            <span className="font-semibold text-sm text-[#162459]">Poradce do kapsy</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-[#66708C]">
            <a href="#sluzby" className="nav-link hover:text-[#162459] transition-colors">Co řešíme</a>
            <a href="#jak-to-funguje" className="nav-link hover:text-[#162459] transition-colors">Jak to funguje</a>
            <a href="#prihlaseni" className="nav-link hover:text-[#162459] transition-colors">Přihlášení</a>
            <Link href="/zasady-ochrany-osobnich-udaju" className="nav-link hover:text-[#162459] transition-colors">
              Ochrana údajů
            </Link>
          </div>
          <span className="text-sm text-[#66708C]">© 2026 · Certifikovaný poradce ProfiFP · OVB Allfinanz</span>
        </div>
      </footer>
    </div>
  )
}
