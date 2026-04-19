import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import PlanEditor from '@/components/advisor/PlanEditor'

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

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#E8E9EE' }}>
      {/* Navbar */}
      <nav className="bg-white border-b" style={{ borderColor: '#E8E9EE' }}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href={`/advisor/${clientId}`} className="text-muted hover:text-navy transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <span className="font-semibold text-navy flex-1">
            {(profile as { full_name: string | null }).full_name || 'Klient'} - Financni plan
          </span>
          <Link
            href={`/advisor/${clientId}/chat`}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-white"
            style={{ background: 'linear-gradient(135deg, #162459, #243471)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Chat
          </Link>
          <Link
            href={`/advisor/${clientId}`}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border"
            style={{ borderColor: '#E8E9EE', color: '#818EAF' }}
          >
            Detail
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto p-4 md:p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-navy">Editor financniho planu</h1>
          <p className="text-muted text-sm mt-1">
            Spravujte varianty, parametry a doporuceni pro kazdy financni okruh.
          </p>
        </div>

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
