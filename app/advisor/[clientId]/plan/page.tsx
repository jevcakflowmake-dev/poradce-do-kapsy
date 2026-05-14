import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MessageCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import PlanEditor from '@/components/advisor/PlanEditor'
import ClientFinancialsEditor, { type ClientFinancials } from '@/components/advisor/ClientFinancialsEditor'
import IncomeProtectionEditor from '@/components/advisor/IncomeProtectionEditor'

export default async function AdvisorPlanPage({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'advisor') return redirect('/dashboard')

  // Load client profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('id', clientId)
    .single()

  if (!profile) return notFound()

  // Load variants
  const { data: variants } = await (supabase.from('plan_variants') as any)
    .select('*')
    .eq('client_id', clientId)
    .order('sort_order')

  // Load params for all variants
  const variantIds = (variants || []).map((v: { id: string }) => v.id)
  let allParams: Record<string, unknown>[] = []
  if (variantIds.length > 0) {
    const { data: paramsData } = await (supabase.from('plan_params') as any)
      .select('*')
      .in('variant_id', variantIds)
      .order('sort_order')
    allParams = paramsData || []
  }

  // Load recommendations
  const { data: recommendations } = await (supabase.from('plan_recommendations') as any)
    .select('*')
    .eq('client_id', clientId)

  // Load client financials (vstupní data)
  const { data: clientFinancials } = await (supabase.from('client_financials') as any)
    .select('*')
    .eq('client_id', clientId)
    .maybeSingle()

  // Load analysis responses
  const { data: analysisData } = await (supabase.from('analysis_responses') as any)
    .select('section, question_id, value')
    .eq('client_id', clientId)

  // Group analysis responses by section
  const analysisResponses: Record<string, Record<string, string>> = {}
  for (const row of (analysisData || []) as Array<{ section: string; question_id: string; value: string }>) {
    if (!analysisResponses[row.section]) {
      analysisResponses[row.section] = {}
    }
    analysisResponses[row.section][row.question_id] = row.value
  }

  const clientName = (profile as { full_name: string | null }).full_name || 'Klient'

  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      {/* Navbar */}
      <nav className="bg-white border-b border-[#E8E9EE] px-6 md:px-10 lg:px-16 xl:px-20 py-4 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <Link
            href={`/advisor/${clientId}`}
            className="inline-flex items-center gap-1 text-[#818EAF] hover:text-[#162459] transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Detail</span>
          </Link>
          <div className="h-6 w-px bg-[#E8E9EE] mx-1 hidden sm:block" />
          <span className="font-semibold text-[#162459] flex-1 truncate">
            {clientName} · Finanční plán
          </span>
          <Link
            href={`/advisor/${clientId}/chat`}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #162459, #243471)' }}
          >
            <MessageCircle className="w-4 h-4" />
            <span className="hidden md:inline">Chat</span>
          </Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16 xl:px-20 py-10 md:py-14">
        <header className="mb-10">
          <div className="section-numeral text-[3rem] md:text-[4.5rem] mb-2">04</div>
          <p className="text-xs tracking-[0.3em] uppercase text-[#818EAF] mb-2">Editor · plán na míru</p>
          <h1
            className="font-display text-[#162459]"
            style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', letterSpacing: '-0.02em', lineHeight: 1.05 }}
          >
            Finanční <span style={{ fontStyle: 'italic', color: '#009EE2' }}>plán</span>
          </h1>
          <p className="text-[#818EAF] mt-3 max-w-xl leading-relaxed">
            Spravujte varianty, parametry a doporučení pro každý finanční okruh klienta.
          </p>
        </header>

        <ClientFinancialsEditor
          clientId={clientId}
          initial={(clientFinancials as ClientFinancials | null) ?? null}
        />

        <IncomeProtectionEditor
          clientId={clientId}
          initial={(variants || []).filter((v: { section: string }) => v.section === 'income') as any[]}
          monthlyIncomeNet={(clientFinancials as { monthly_income_net: number | null } | null)?.monthly_income_net ?? null}
        />

        <PlanEditor
          clientId={clientId}
          initialVariants={variants || []}
          initialParams={allParams as any[]}
          initialRecommendations={recommendations || []}
          analysisResponses={analysisResponses}
        />
      </div>
    </div>
  )
}
