import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { ZAKLADNI_OG, absoluteUrl } from '@/lib/site'
import { createClient } from '@/lib/supabase/server'
import SiteHeader from '@/components/landing/SiteHeader'
import HeroSection from '@/components/landing/HeroSection'
import ProblemSection from '@/components/landing/ProblemSection'
import HowItWorksSection from '@/components/landing/HowItWorksSection'
import AboutSection from '@/components/landing/AboutSection'
import PartnersSection from '@/components/landing/PartnersSection'
import TopicsSection from '@/components/landing/TopicsSection'
import ValuesSection from '@/components/landing/ValuesSection'
import PricingSection from '@/components/landing/PricingSection'
import FaqSection from '@/components/landing/FaqSection'
import NovinkySection from '@/components/landing/NovinkySection'
import CtaSection from '@/components/landing/CtaSection'
import SiteFooter from '@/components/landing/SiteFooter'

// Stejná absoluteUrl() jako v sitemap.ts – jinak canonical a sitemap
// nesouhlasí v koncovém lomítku.
export const metadata: Metadata = {
  alternates: { canonical: absoluteUrl('/') },
  openGraph: { ...ZAKLADNI_OG, url: absoluteUrl('/') },
}

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
      <PartnersSection />
      <TopicsSection />
      <ValuesSection />
      <PricingSection />
      <NovinkySection />
      <FaqSection />
      <CtaSection />
      <SiteFooter />
    </div>
  )
}
