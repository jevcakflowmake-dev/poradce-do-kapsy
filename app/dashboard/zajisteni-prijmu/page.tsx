import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import QuestionnaireForm from '@/components/questionnaire/QuestionnaireForm'
import type { Questionnaire, Answers } from '@/src/questionnaires/zajisteni-prijmu.questionnaire'

const KEY = 'zajisteni_prijmu'

export const metadata = {
  title: 'Zajištění příjmu',
}

export default async function ZajisteniPrijmuPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Aktivní verze dotazníku (RLS pustí přihlášenému aktivní definici).
  const { data: def } = await supabase
    .from('questionnaire_definitions')
    .select('key, version, definition')
    .eq('key', KEY)
    .eq('is_active', true)
    .single()

  if (!def) {
    return (
      <div className="mx-auto max-w-2xl py-10">
        <h1 className="font-display text-h2 text-navy">Zajištění příjmu</h1>
        <p className="mt-3 text-lead text-slate">
          Dotazník zatím není k dispozici. Zkuste to prosím později.
        </p>
      </div>
    )
  }

  // Najdi rozpracovaný, nebo poslední odeslaný; když nic, založ draft.
  const { data: existujici } = await supabase
    .from('questionnaires')
    .select('id, answers, status')
    .eq('client_id', user.id)
    .eq('definition_key', KEY)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  let dotaznik = existujici
  if (!dotaznik) {
    const { data: novy, error } = await supabase
      .from('questionnaires')
      .insert({
        client_id: user.id,
        definition_key: def.key,
        definition_version: def.version,
      })
      .select('id, answers, status')
      .single()
    if (error || !novy) {
      return (
        <div className="mx-auto max-w-2xl py-10">
          <h1 className="font-display text-h2 text-navy">Zajištění příjmu</h1>
          <p className="mt-3 text-lead text-slate">
            Dotazník se nepodařilo otevřít. Zkuste stránku načíst znovu.
          </p>
        </div>
      )
    }
    dotaznik = novy
  }

  return (
    <QuestionnaireForm
      definice={def.definition as unknown as Questionnaire}
      dotaznikId={dotaznik.id}
      initialAnswers={(dotaznik.answers as unknown as Answers) ?? {}}
      initialStatus={dotaznik.status}
    />
  )
}
