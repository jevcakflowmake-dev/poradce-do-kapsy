/**
 * Ukázkový klient s hotovým finančním plánem.
 *
 * Slouží k prohlédnutí klientského rozhraní bez sahání na data skutečných
 * lidí. Údaje jsou vymyšlené, e-mail je na `example.com` — doména vyhrazená
 * pro příklady (RFC 2606), takže na ni nikdy nikomu nic neodejde.
 *
 *   npx tsx scripts/ukazkovy-plan.mts            založí (nebo přepíše)
 *   npx tsx scripts/ukazkovy-plan.mts --smazat   odstraní i s daty
 *
 * Pozor: píše do ostré databáze, jiná v projektu není. Poradci se ukázkový
 * klient objeví v seznamu klientů jako každý jiný.
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { spojHodnoty, spojSkupinu } from '../lib/analysis-sections'

const EMAIL = 'ukazka@example.com'
const HESLO = 'ukazka2026'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter((r) => r.includes('='))
    .map((r) => [r.slice(0, r.indexOf('=')), r.slice(r.indexOf('=') + 1).trim()]),
)
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
})

/** Supabase-js chyby nevyhazuje, vrací je. Bez tohohle by seed tiše chyběl. */
function over(kde: string, error: { message: string } | null) {
  if (error) {
    console.error(`CHYBA (${kde}):`, error.message)
    process.exit(1)
  }
}

async function najdi(): Promise<string | null> {
  const { data } = await admin.auth.admin.listUsers({ perPage: 200 })
  return data.users.find((u) => u.email === EMAIL)?.id ?? null
}

const stavajici = await najdi()

if (process.argv.includes('--smazat')) {
  if (!stavajici) {
    console.log('Ukázkový klient neexistuje, není co mazat.')
    process.exit(0)
  }
  over('mazání', (await admin.auth.admin.deleteUser(stavajici)).error)
  console.log('Ukázkový klient smazán i se všemi navázanými daty.')
  process.exit(0)
}

// Znovuzaložení: smazání účtu kaskádou odklidí i plán, aby se data nezdvojila.
if (stavajici) over('úklid', (await admin.auth.admin.deleteUser(stavajici)).error)

const { data: novy, error: chybaUctu } = await admin.auth.admin.createUser({
  email: EMAIL,
  password: HESLO,
  email_confirm: true,
  app_metadata: { role: 'client' },
})
over('účet', chybaUctu)
const ID = novy!.user.id

over(
  'profil',
  (
    await admin
      .from('profiles')
      .update({
        full_name: 'Petra Ukázková',
        age: 38,
        income: '48000',
        family_status: 'family',
        risk_profile: 'balanced',
        goals: ['income', 'housing', 'retirement', 'children', 'investing', 'property'],
        onboarding_completed: true,
        status: 'financni_plan',
      })
      .eq('id', ID)
  ).error,
)

over(
  'finance',
  (
    await admin.from('client_financials').insert({
      client_id: ID,
      age: 38,
      retirement_age: 65,
      monthly_income_net: 48000,
      expected_state_pension: 24500,
      dependents_count: 2,
      has_mortgage: true,
      mortgage_remaining_amount: 2400000,
      mortgage_remaining_years: 22,
      property_value_real_estate: 5200000,
      property_value_movables: 450000,
      possible_savings: 1140,
      reserve: 150000,
    })
  ).error,
)

const odpovedi: Array<[string, string, string]> = [
  ['income', 'employment', 'Zaměstnanec'],
  ['income', 'monthly_income', '48000'],
  ['income', 'income_variable', 'Do třetiny'],
  ['income', 'work_years', '5–15 let'],
  ['income', 'work_risk', 'Převážně u počítače / v kanceláři'],
  ['income', 'essential_expenses', '36000'],
  ['income', 'income_drop', '20000'],
  ['income', 'reserve_months', '1–3 měsíce'],
  ['income', 'other_loans', '120000'],
  ['income_cover', 'invalidity', 'Ano'],
  ['income_cover', 'serious_illness', 'Ano'],
  ['income_cover', 'death_coverage', 'Ano'],
  ['income_cover', 'death_coverage_amount', '2500000'],
  ['income_cover', 'existing_policy', 'Ano'],
  ['income_cover', 'existing_policy_known', 'Ne, podepsal/a jsem to a nevím'],
  ['income_cover', 'monthly_budget', '1500'],
  ['housing', 'housing_situation', 'Ve vlastním s hypotékou'],
  ['housing', 'mortgage_balance', '2400000'],
  ['housing', 'mortgage_payment', '18000'],
  ['housing', 'mortgage_rate', '5,4'],
  ['housing', 'mortgage_fixation', 'Do roka'],
  ['housing', 'mortgage_bank', 'Česká spořitelna'],
  ['housing', 'refinance_interest', 'Nevím – řekněte mi, jestli se to vyplatí'],
  ['retirement', 'retirement_age', '65'],
  ['retirement', 'desired_pension', '30000'],
  ['retirement', 'retirement_saved', '180000'],
  ['retirement', 'current_savings', '1000'],
  ['retirement', 'monthly_pension_budget', '3000'],
  [
    'children',
    'children_list',
    spojSkupinu([
      { name: 'Adam', age: '11', insure: 'Ano', saving: 'Ano', monthly: '1000' },
      { name: 'Eliška', age: '6', insure: 'Ano', saving: 'Ne', monthly: '' },
    ]),
  ],
  ['investing', 'investment_goal', 'Na rentu v důchodu'],
  ['investing', 'investment_horizon', '10+ let'],
  ['investing', 'monthly_invest', '3000'],
  ['investing', 'risk_tolerance', 'Menší výkyvy snesu'],
  ['property', 'has_car', 'Ano'],
  ['property', 'car_insurance', 'Jen povinné ručení'],
  ['property', 'has_property', 'Ano'],
  ['property', 'property_insured', 'Ano'],
  ['property', 'household_insured', 'Nevím'],
  ['property', 'liability_insured', 'Ne'],
  ['personal', 'full_name', 'Petra Ukázková'],
  ['personal', 'email', EMAIL],
  ['personal', 'age', '38'],
  ['personal', 'family_status', 'Rodina s dětmi'],
  ['personal', 'height', '170'],
  ['personal', 'weight', '68'],
  ['personal', 'smoking', 'Ne'],
  ['personal', 'sports', spojHodnoty(['Běh, kolo, plavání, fitness, míčové hry', 'Lyže, snowboard'])],
  ['personal', 'sports_level', 'Rekreačně'],
]
over(
  'analýza',
  (
    await admin.from('analysis_responses').insert(
      odpovedi.map(([section, question_id, value]) => ({ client_id: ID, section, question_id, value })),
    )
  ).error,
)

interface Varianta {
  section: string
  company: string
  logo: string
  monthly_payment: string
  details: Record<string, unknown>
  params: Array<[string, string, string]>
}

const varianty: Varianta[] = [
  {
    section: 'income',
    company: 'Kooperativa',
    logo: 'K',
    monthly_payment: '1 160 Kč',
    details: {
      payout_60: 29000,
      payout_50: 24000,
      waiting_period_days: 29,
      max_payout_years: 2,
      accident_pn_combine: true,
      daily_accident: 300,
      daily_sick_leave: 500,
      daily_hospitalization: 400,
      permanent_consequences: 1000000,
      serious_illness: 600000,
      self_sufficiency: 500000,
      disability_1: 400000,
      disability_2: 800000,
      disability_3: 1500000,
      death: 2500000,
      produkt: {
        nazev: 'NA PŘÁNÍ',
        doVeku: 'do 65 let',
        frekvence: 'Měsíčně',
        popis:
          'Rizikové životní pojištění. Vyplácí při pracovní neschopnosti, úrazu, závažné nemoci i invaliditě.',
        hlaseni: 'https://www.koop.cz/pojistna-udalost',
        kontakt: '957 105 105',
      },
    },
    params: [
      ['Pracovní neschopnost', '500 Kč/den', 'Od 29. dne, maximálně dva roky.'],
      ['Invalidita III. stupně', '1 500 000 Kč', 'Jednorázově, plus zproštění od placení.'],
      ['Smrt', '2 500 000 Kč', 'Pokryje zbytek hypotéky i rok výpadku příjmu.'],
    ],
  },
  {
    section: 'income',
    company: 'Allianz',
    logo: 'A',
    monthly_payment: '1 340 Kč',
    details: {
      payout_60: 31000,
      payout_50: 26000,
      waiting_period_days: 15,
      max_payout_years: 3,
      accident_pn_combine: false,
      daily_accident: 350,
      daily_sick_leave: 600,
      daily_hospitalization: 500,
      permanent_consequences: 1200000,
      serious_illness: 800000,
      self_sufficiency: 700000,
      disability_1: 500000,
      disability_2: 1000000,
      disability_3: 1800000,
      death: 2500000,
      produkt: {
        nazev: 'ŽIVOT+',
        doVeku: 'do 65 let',
        frekvence: 'Měsíčně',
        popis:
          'Plnění už od 15. dne nemoci a širší seznam závažných diagnóz. Dražší, ale platí dřív a déle.',
        hlaseni: 'https://www.allianz.cz/hlaseni-skod',
        kontakt: '241 170 000',
      },
    },
    params: [
      ['Pracovní neschopnost', '600 Kč/den', 'Už od 15. dne, maximálně tři roky.'],
      ['Invalidita III. stupně', '1 800 000 Kč', 'Jednorázově, plus zproštění od placení.'],
      ['Závažná onemocnění', '800 000 Kč', 'Širší seznam diagnóz než u konkurence.'],
    ],
  },
  {
    section: 'housing',
    company: 'Česká spořitelna',
    logo: 'ČS',
    monthly_payment: '16 480 Kč',
    details: {
      produkt: {
        nazev: 'Refinancování hypotéky',
        doVeku: 'zbývá 22 let',
        frekvence: 'Měsíčně',
        popis: 'Převod hypotéky k jiné bance se stejnou dobou splatnosti a nižší sazbou.',
        kontakt: '956 777 956',
      },
    },
    params: [
      ['Úroková sazba', '4,49 % p. a.', 'Fixace na pět let.'],
      ['Měsíční splátka', '16 480 Kč', 'O 1 520 Kč méně než platíte teď.'],
      ['Poplatky za refinancování', '0 Kč', 'Banka je přebírá.'],
    ],
  },
  {
    section: 'housing',
    company: 'Raiffeisenbank',
    logo: 'RB',
    monthly_payment: '16 900 Kč',
    details: {},
    params: [
      ['Úroková sazba', '4,69 % p. a.', 'Fixace na tři roky.'],
      ['Měsíční splátka', '16 900 Kč', 'O 1 100 Kč méně než platíte teď.'],
      ['Odhad nemovitosti', 'zdarma', 'Do konce roku.'],
    ],
  },
  {
    section: 'retirement',
    company: 'Conseq',
    logo: 'C',
    monthly_payment: '3 000 Kč',
    details: {
      produkt: {
        nazev: 'Horizont Invest — DIP',
        doVeku: 'do 65 let',
        frekvence: 'Měsíčně',
        popis:
          'Dlouhodobý investiční produkt. Vklady lze odečíst z daní a portfolio se před koncem samo zkonzervativňuje.',
        kontakt: 'https://www.conseq.cz/kontakty',
      },
    },
    params: [
      ['Typ produktu', 'DIP', 'Odečet z daní až 48 000 Kč ročně.'],
      ['Strategie', 'Vyvážená', 'Do důchodu zbývá 27 let.'],
      ['Vstupní poplatek', '0 %', 'Průběžný poplatek 0,8 % ročně.'],
    ],
  },
  {
    section: 'investing',
    company: 'Amundi',
    logo: 'AM',
    monthly_payment: '3 000 Kč',
    details: {
      produkt: {
        nazev: 'Rentier Invest',
        doVeku: 'bez omezení',
        frekvence: 'Měsíčně',
        popis: 'Pravidelné investování do smíšeného portfolia. Peníze lze kdykoliv vybrat bez sankce.',
        kontakt: 'https://www.amundi.cz',
      },
    },
    params: [
      ['Měsíční investice', '3 000 Kč', 'Lze kdykoliv změnit nebo pozastavit.'],
      ['Doporučený horizont', '10+ let', 'Odpovídá cíli renty v důchodu.'],
    ],
  },
  {
    section: 'property',
    company: 'Generali Česká',
    logo: 'GČ',
    monthly_payment: '420 Kč',
    details: {
      produkt: {
        nazev: 'Můj domov',
        doVeku: 'na dobu neurčitou',
        frekvence: 'Ročně',
        popis: 'Pojištění domácnosti a odpovědnosti. Kryje i škodu, kterou způsobíte vy nebo děti.',
        hlaseni: '241 114 114',
        kontakt: 'https://www.generaliceska.cz/kontakty',
      },
    },
    params: [
      ['Vybavení domácnosti', '1 200 000 Kč', 'Včetně elektroniky a kol.'],
      ['Odpovědnost', '10 000 000 Kč', 'Vy i děti, i v zahraničí.'],
    ],
  },
]

for (const [poradi, v] of varianty.entries()) {
  const { params, ...radek } = v
  const { data, error } = await admin
    .from('plan_variants')
    .insert({ client_id: ID, ...radek, sort_order: poradi })
    .select('id')
    .single()
  over(`varianta ${v.company}`, error)
  over(
    `parametry ${v.company}`,
    (
      await admin.from('plan_params').insert(
        params.map(([param_label, value, note], i) => ({
          variant_id: data!.id,
          param_key: param_label.toLowerCase().replace(/\s+/g, '_'),
          param_label,
          value,
          note,
          sort_order: i,
        })),
      )
    ).error,
  )
}

over(
  'doporučení',
  (
    await admin.from('plan_recommendations').insert([
      { client_id: ID, section: 'income', status: 'action', items: [] },
      { client_id: ID, section: 'housing', status: 'recommendation', items: [] },
      { client_id: ID, section: 'retirement', status: 'action', items: [] },
      { client_id: ID, section: 'investing', status: 'recommendation', items: [] },
      { client_id: ID, section: 'property', status: 'recommendation', items: [] },
      {
        client_id: ID,
        section: 'children',
        status: 'action',
        items: [
          'Adam (11) nemá úrazové pojištění. U dítěte, které sportuje, bych začal tímhle.',
          'Eliška (6) zatím spoření nemá. Stačí 500 Kč měsíčně, čas je tu důležitější než částka.',
        ],
      },
    ])
  ).error,
)

over(
  'zpráva',
  (
    await admin.from('messages').insert({
      client_id: ID,
      sender_role: 'advisor',
      content:
        'Dobrý den, plán je hotový. Projděte si ho a u každé oblasti mi dejte vědět, jestli chcete pokračovat.',
    })
  ).error,
)

console.log('Ukázkový klient založen.')
console.log('  e-mail:', EMAIL)
console.log('  heslo: ', HESLO)
console.log('  id:    ', ID)
