import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import HeroSection from '@/components/landing/HeroSection'
import StatsBand from '@/components/landing/StatsBand'
import HowItWorksHorizontal from '@/components/landing/HowItWorksHorizontal'
import BenefitsSection from '@/components/landing/BenefitsSection'
import ServicesSection from '@/components/landing/ServicesSection'
import CtaSection from '@/components/landing/CtaSection'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const role = user.user_metadata?.role
    redirect(role === 'advisor' ? '/advisor' : '/dashboard')
  }

  return (
    <div className="min-h-screen bg-white">
      <HeroSection />
      <StatsBand />
      <HowItWorksHorizontal />
      <BenefitsSection />
      <ServicesSection />
      <CtaSection />

      <footer className="px-6 md:px-10 lg:px-16 xl:px-20 py-10 border-t border-[#E8E9EE] bg-white">
        <div className="max-w-7xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#162459] flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="font-semibold text-sm text-[#162459]">Poradce do kapsy</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-[#818EAF]">
            <a href="#jak-to-funguje" className="nav-link hover:text-[#162459] transition-colors">Jak to funguje</a>
            <a href="#sluzby" className="nav-link hover:text-[#162459] transition-colors">Služby</a>
            <a href="#prihlaseni" className="nav-link hover:text-[#162459] transition-colors">Přihlášení</a>
          </div>
          <span className="text-sm text-[#818EAF]">© 2025 · Certifikovaný poradce ProfiFP · OVB Allfinanz</span>
        </div>
      </footer>
    </div>
  )
}
