import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MessageCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import type { PlanParam } from '@/lib/types/database'
import PlanEditor from '@/components/advisor/PlanEditor'
import ClientFinancialsEditor, { type ClientFinancials } from '@/components/advisor/ClientFinancialsEditor'
import IncomeProtectionEditor from '@/components/advisor/IncomeProtectionEditor'
import ZverejneniPlanu from '@/components/advisor/ZverejneniPlanu'
import { BARVY } from '@/lib/barvy'

export default async function AdvisorPlanPage({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.app_metadata?.role !== 'advisor') return redirect('/dashboard')

  // Load client profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, plan_zverejnen_at')
    .eq('id', clientId)
    .single()

  if (!profile) return notFound()

  // Load variants
  const { data: variants } = await supabase.from('plan_variants')
    .select('*')
    .eq('client_id', clientId)
    .order('sort_order')

  // Load params for all variants
  const variantIds = (variants ?? []).map((v) => v.id)
  let allParams: PlanParam[] = []
  if (variantIds.length > 0) {
    const { data: paramsData } = await supabase.from('plan_params')
      .select('*')
      .in('variant_id', variantIds)
      .order('sort_order')
    allParams = paramsData || []
  }

  // Load recommendations
  const { data: recommendations } = await supabase.from('plan_recommendations')
    .select('*')
    .eq('client_id', clientId)

  // Load client financials (vstupní data)
  const { data: clientFinancials } = await supabase.from('client_financials')
    .select('*')
    .eq('client_id', clientId)
    .maybeSingle()

  // Load analysis responses
  const { data: analysisData } = await supabase.from('analysis_responses')
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
    <div className="min-h-screen bg-cream">
      {/* Navbar */}
      <nav className="bg-surface border-b border-line px-6 md:px-10 lg:px-16 xl:px-20 py-4 sticky top-0 z-30">
        <div className="max-w-8xl mx-auto flex items-center gap-3">
          <Link
            href={`/advisor/${clientId}`}
            className="inline-flex items-center gap-1 text-slate hover:text-navy transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Detail</span>
          </Link>
          <div className="h-6 w-px bg-line mx-1 hidden sm:block" />
          <span className="font-semibold text-navy flex-1 truncate">
            {clientName} · Finanční plán
          </span>
          <Link
            href={`/advisor/${clientId}/chat`}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-card text-sm font-semibold text-white"
            style={{ background: BARVY.navy }}
          >
            <MessageCircle className="w-4 h-4" />
            <span className="hidden md:inline">Chat</span>
          </Link>
        </div>
      </nav>

      <div className="max-w-shell mx-auto px-6 md:px-10 lg:px-16 xl:px-20 py-10 md:py-14">
        <header className="mb-10">
          <p className="text-xs tracking-[0.3em] uppercase text-slate mb-2">Editor · plán na míru</p>
          <h1
            className="font-display text-navy text-h2"
          >
            Finanční plán
          </h1>
          <p className="text-slate mt-3 max-w-xl leading-relaxed">
            Spravujte varianty, parametry a doporučení pro každý finanční okruh klienta.
          </p>
        </header>

        {/* Klient plán uvidí, až ho tady zveřejníte – do té doby se dá stavět v klidu. */}
        <div className="mb-8">
          <ZverejneniPlanu
            clientId={clientId}
            zverejneno={(profile as { plan_zverejnen_at: string | null }).plan_zverejnen_at}
            maObsah={(variants ?? []).length > 0 || (recommendations ?? []).length > 0}
          />
        </div>

        <ClientFinancialsEditor
          clientId={clientId}
          initial={(clientFinancials as ClientFinancials | null) ?? null}
        />

        <IncomeProtectionEditor
          clientId={clientId}
          initial={(variants ?? []).filter((v) => v.section === 'income')}
          monthlyIncomeNet={(clientFinancials as { monthly_income_net: number | null } | null)?.monthly_income_net ?? null}
        />

        {/* Databáze nechává pořadí, poznámku i stav prázdné; editor je chce
            vyplněné, tak je doplňujeme tady na hranici, ne uvnitř komponenty. */}
        <PlanEditor
          clientId={clientId}
          initialVariants={(variants ?? []).map((v) => ({ ...v, sort_order: v.sort_order ?? 0 }))}
          initialParams={(allParams ?? []).map((p) => ({
            ...p,
            note: p.note ?? '',
            sort_order: p.sort_order ?? 0,
          }))}
          initialRecommendations={(recommendations ?? []).map((r) => ({
            ...r,
            status: r.status ?? 'recommendation',
            items: r.items ?? [],
          }))}
          analysisResponses={analysisResponses}
        />
      </div>
    </div>
  )
}
