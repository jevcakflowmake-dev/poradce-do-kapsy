import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SiteHeader from '@/components/landing/SiteHeader'
import HeroSection from '@/components/landing/HeroSection'
import ProblemSection from '@/components/landing/ProblemSection'
import HowItWorksSection from '@/components/landing/HowItWorksSection'
import AboutSection from '@/components/landing/AboutSection'
import ValuesSection from '@/components/landing/ValuesSection'
import PricingSection from '@/components/landing/PricingSection'
import FaqSection from '@/components/landing/FaqSection'
import CtaSection from '@/components/landing/CtaSection'
import SiteFooter from '@/components/landing/SiteFooter'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const role = user.app_metadata?.role
    redirect(role === 'advisor' ? '/advisor' : '/dashboard')
  }

  return (
    <div className="min-h-screen bg-cream">
      <SiteHeader />
      <HeroSection />
      <ProblemSection />
      <HowItWorksSection />
      <AboutSection />
      <ValuesSection />
      <PricingSection />
      <FaqSection />
      <CtaSection />
      <SiteFooter />
    </div>
  )
}
