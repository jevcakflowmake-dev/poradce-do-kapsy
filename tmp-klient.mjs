import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter((r) => r.includes('='))
    .map((r) => [r.slice(0, r.indexOf('=')), r.slice(r.indexOf('=') + 1).trim()]),
)
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})
const S = String.fromCharCode(31)
const akce = process.argv[2]
const EMAIL = 'test-seznam@example.com'

async function najdi() {
  const { data } = await admin.auth.admin.listUsers({ perPage: 1000 })
  return data.users.find((u) => u.email === EMAIL)
}

if (akce === 'smazat') {
  const u = await najdi()
  if (u) {
    await admin.auth.admin.deleteUser(u.id)
    console.log('dočasný klient smazán')
  } else console.log('nic k mazání')
  process.exit(0)
}

const { data, error } = await admin.auth.admin.createUser({
  email: EMAIL,
  password: crypto.randomUUID(),
  email_confirm: true,
  user_metadata: { full_name: 'Tomáš Seznam' },
  app_metadata: { role: 'client' },
})
if (error) {
  console.error('create:', error.message)
  process.exit(1)
}
const id = data.user.id
await admin.from('profiles').update({ full_name: 'Tomáš Seznam', status: 'novy', age: 40, family_status: 'family' }).eq('id', id)

const odpovedi = {
  income: {
    employment: 'OSVČ',
    monthly_income: '60000',
    income_variable: 'Většinu – když nepracuji, nevydělávám',
    sick_pay_osvc: 'Ne',
    social_contributions: 'Minimum / paušální daň',
    work_years: 'Méně než 5 let',
    work_risk: 'Fyzická práce, řemeslo, výroba',
    essential_expenses: '40000',
    reserve_months: '1–3 měsíce',
  },
  income_cover: { existing_policy: 'Ano', existing_policy_known: 'Ne, podepsal/a jsem to a nevím' },
  housing: { has_mortgage: 'Ano', mortgage_balance: '2500000' },
  children: { children_count: '2', children_ages: '6, 11' },
  personal: {
    age: '40',
    height: '180',
    weight: '120',
    treatment: ['Záda, klouby, páteř'].join(S),
    family_history: ['Rakovina'].join(S),
    sports: ['Motorka, motokáry, závody'].join(S),
  },
}
const radky = []
for (const [section, qs] of Object.entries(odpovedi))
  for (const [question_id, value] of Object.entries(qs)) radky.push({ client_id: id, section, question_id, value })
const { error: e2 } = await admin.from('analysis_responses').insert(radky)
console.log('dočasný klient', id, '| odpovědí:', e2 ? 'CHYBA ' + e2.message : radky.length)
