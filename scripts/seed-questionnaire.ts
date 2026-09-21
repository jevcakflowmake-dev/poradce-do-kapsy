/**
 * scripts/seed-questionnaire.ts
 * Nahraje aktuální TS definici dotazníku do public.questionnaire_definitions
 * a nastaví ji jako aktivní. Spouštět se service role:
 *
 *   npx tsx scripts/seed-questionnaire.ts
 *
 * Bere klíče z .env.local (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY),
 * nebo je předej ručně přes SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=...
 *
 * Při změně otázek zvyš `version` v TS configu – staré odpovědi zůstanou
 * navázané na svou verzi, nové dotazníky poběží na té nové.
 */
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import { zajisteniPrijmuQuestionnaire as def } from '../src/questionnaires/zajisteni-prijmu.questionnaire'

// .env.local má přednost jen tam, kde proměnná není v prostředí
function zEnvSouboru(klic: string): string | undefined {
  if (process.env[klic]) return process.env[klic]
  try {
    const radek = readFileSync('.env.local', 'utf8').split('\n').find((r) => r.startsWith(klic + '='))
    return radek?.slice(klic.length + 1).trim()
  } catch {
    return undefined
  }
}

const url = process.env.SUPABASE_URL || zEnvSouboru('NEXT_PUBLIC_SUPABASE_URL')
const serviceKey = zEnvSouboru('SUPABASE_SERVICE_ROLE_KEY')

if (!url || !serviceKey) {
  console.error('Chybí SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (ani v .env.local).')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } })

async function main() {
  // 1. deaktivuj předchozí verze stejného key
  const { error: deactivateError } = await supabase
    .from('questionnaire_definitions')
    .update({ is_active: false })
    .eq('key', def.key)
    .neq('version', def.version)
  if (deactivateError) throw deactivateError

  // 2. upsert aktuální verze
  const { error: upsertError } = await supabase
    .from('questionnaire_definitions')
    .upsert(
      {
        key: def.key,
        version: def.version,
        title: def.title,
        definition: def,
        is_active: true,
      },
      { onConflict: 'key,version' },
    )
  if (upsertError) throw upsertError

  console.log(`✓ ${def.key} v${def.version} je aktivní`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
