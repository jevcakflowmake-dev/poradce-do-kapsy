/**
 * Převod odpovědí z analýzy na vstup pro `computeRecommendation()`.
 *
 * Dotazník „Zajištění příjmu“ byl sloučený do analýzy, ale jeho výpočet částek
 * a flagů pro poradce zůstal – počítá nad kódy („osvc“, „do_1m“), zatímco
 * analýza ukládá rovnou text volby („OSVČ“, „Méně než měsíc“). Tenhle soubor
 * je ten překlad, aby slovníky nebyly rozsypané po komponentách.
 *
 * Vstupy leží ve více sekcích: příjem a výdaje v `income`, stávající pojistka
 * v `income_cover`, hypotéka v `housing`, děti v `children`, věk, míry
 * a zdraví v `personal`.
 */
import {
  computeRecommendation,
  type Answers,
  type Recommendation,
} from '@/src/questionnaires/zajisteni-prijmu.questionnaire'
import { JEN_URAZ, SECTIONS, rozdelHodnoty, rozdelSkupinu } from './analysis-sections'

/** Odpovědi analýzy tak, jak je drží průvodce i poradcovský detail: sekce → otázka → hodnota. */
export type AnalyzaOdpovedi = Record<string, Record<string, string>>

/**
 * Otázky, ze kterých výpočet čte. Seznam klientů podle nich filtruje dotaz,
 * ať netahá celou analýzu všech klientů kvůli osmi flagům.
 * Když přibude vstup do `naDotaznikoveOdpovedi`, patří i sem.
 */
export const POTREBNE_OTAZKY: string[] = [
  // income
  'cover_scope', 'employment', 'monthly_income', 'income_variable', 'sick_pay_osvc',
  'social_contributions', 'work_years', 'work_risk',
  'essential_expenses', 'reserve_months', 'other_loans',
  // income_cover
  'existing_policy', 'existing_policy_known',
  // housing
  'housing_situation', 'mortgage_balance',
  // children
  'children_list',
  // personal
  'age', 'height', 'weight', 'family_status',
  'treatment', 'family_history', 'sports', 'sports_level',
]

const TYP_PRACE: Record<string, string> = {
  'Zaměstnanec': 'zamestnanec',
  'OSVČ': 'osvc',
  'Vlastní firma (s.r.o.)': 'jednatel',
  'Kombinace': 'kombinace',
  'Student': 'jine',
  'Důchodce': 'jine',
}

const ANO_NE_NEVIM: Record<string, string> = {
  'Ano': 'ano',
  'Ne': 'ne',
  'Nevím': 'nevim',
  'Nevím / mám něco z dětství': 'nevim',
}

const PRIJEM_VARIABILNI: Record<string, string> = {
  'Skoro žádnou, mám pevný plat': 'zadnou',
  'Do třetiny': 'do_tretiny',
  'Většinu – když nepracuji, nevydělávám': 'vetsinu',
}

const REZERVA: Record<string, string> = {
  'Méně než měsíc': 'do_1m',
  '1–3 měsíce': '1_3m',
  '3–6 měsíců': '3_6m',
  'Více než 6 měsíců': 'nad_6m',
}

const ODVODY: Record<string, string> = {
  'Minimum / paušální daň': 'minimum',
  'Více než minimum': 'vic',
  'Nevím': 'nevim',
}

const ROKY_PRACE: Record<string, string> = {
  'Méně než 5 let': 'do_5',
  '5–15 let': '5_15',
  'Více než 15 let': 'nad_15',
}

const RIZIKO_PRACE: Record<string, string> = {
  'Převážně u počítače / v kanceláři': 'kancelar',
  'Hodně na nohou, ale bez fyzické námahy': 'pohyb',
  'Fyzická práce, řemeslo, výroba': 'manualni',
  'Riziková (výšky, těžké stroje, hasiči, policie…)': 'rizikova',
  'Profesionální řidič / hodně za volantem': 'ridic',
}

const ANAMNEZA: Record<string, string> = {
  'Ne / nevím o tom': 'ne',
  'Rakovina': 'rakovina',
  'Infarkt nebo mrtvice': 'infarkt_mrtvice',
  'Cukrovka': 'cukrovka',
  'Roztroušená skleróza, Parkinson, Alzheimer': 'neurologie',
}

const LECBA: Record<string, string> = {
  'Ne, jsem zdravý/á': 'nic',
  'Vysoký tlak, srdce, cholesterol': 'tlak_srdce',
  'Cukrovka': 'cukrovka',
  'Záda, klouby, páteř': 'zada_klouby',
  'Psychika (úzkosti, deprese, vyhoření)': 'psychika',
  'Štítná žláza, hormony': 'stitna',
  'Onkologické onemocnění (i vyléčené)': 'onkologie',
  'Něco jiného': 'jine',
}

const SPORTY: Record<string, string> = {
  'Žádné / jen procházky': 'zadne',
  'Běh, kolo, plavání, fitness, míčové hry': 'bezne',
  'Lyže, snowboard': 'zimni',
  'Bojové sporty': 'bojove',
  'Motorka, motokáry, závody': 'moto',
  'Horolezectví, ferraty, skialpinismus': 'horske',
  'Paragliding, potápění, rafting, kite': 'letecke_vodni',
  'Jezdectví nebo jiný rizikový sport': 'kone_jine',
}

const UROVEN_SPORTU: Record<string, string> = {
  'Rekreačně': 'rekreacne',
  'Registrovaně / závodně (amatér)': 'registrovane',
  'Profesionálně nebo za peníze': 'profi',
}

const ZNALOST_POJISTKY: Record<string, string> = {
  'Ano, vím přesně': 'ano',
  'Zhruba': 'castecne',
  'Ne, podepsal/a jsem to a nevím': 'ne',
}

/** „2 500 000 Kč“ → 2500000. Prázdné nebo nečíselné → undefined. */
function cislo(v: string | undefined): number | undefined {
  if (!v) return undefined
  const ocistene = v.replace(/[^\d,.-]/g, '').replace(',', '.')
  const n = Number.parseFloat(ocistene)
  return Number.isFinite(n) ? n : undefined
}

/** Volby zaškrtávací otázky přeložené na kódy; neznámé se zahodí. */
function kody(
  hodnota: string | undefined,
  sekce: string,
  otazka: string,
  slovnik: Record<string, string>,
): string[] {
  const options = SECTIONS.find((s) => s.id === sekce)?.questions.find((q) => q.id === otazka)?.options
  return rozdelHodnoty(hodnota, options)
    .map((v) => slovnik[v])
    .filter((v): v is string => Boolean(v))
}

/** Věky dětí z opakovatelné skupiny. Prázdné a nečíselné zápisy se zahodí. */
function vekyDeti(ulozeno: string | undefined): number[] {
  return rozdelSkupinu(ulozeno)
    .map((d) => cislo(d.age))
    .filter((n): n is number => typeof n === 'number')
}

export function naDotaznikoveOdpovedi(a: AnalyzaOdpovedi): Answers {
  const income = a.income ?? {}
  const cover = a.income_cover ?? {}
  const housing = a.housing ?? {}
  const children = a.children ?? {}
  const personal = a.personal ?? {}

  // U „jen úraz“ se na nemocenskou neptáme. Výpočet bere chybějící odpověď
  // jako „nemá“ (u plné větve opatrný předpoklad – většina OSVČ ji nemá)
  // a hlásil by „OSVČ bez nemocenského, PN je prioritou“, i když PN vůbec
  // není předmětem. Typ práce slouží ve výpočtu jen k tomuhle, proto ven.
  const jenUraz = income.cover_scope === JEN_URAZ

  return {
    // — práce a příjem —
    typ_prace: jenUraz ? undefined : TYP_PRACE[income.employment],
    prijem_cisty: cislo(income.monthly_income),
    prijem_variabilni: PRIJEM_VARIABILNI[income.income_variable],
    osvc_nemocenska: ANO_NE_NEVIM[income.sick_pay_osvc],
    osvc_odvody: ODVODY[income.social_contributions],
    roky_prace: ROKY_PRACE[income.work_years],
    naplan_prace: RIZIKO_PRACE[income.work_risk],

    // — výdaje a závazky —
    vydaje_nutne: cislo(income.essential_expenses),
    rezerva: REZERVA[income.reserve_months],
    jine_uvery: cislo(income.other_loans),
    // Zbývající dluh, ne plánovaný úvěr – `mortgage_amount` je „jakou výši chcete“.
    hypoteka_zustatek:
      housing.housing_situation === 'Ve vlastním s hypotékou' ? cislo(housing.mortgage_balance) : 0,

    // — rodina —
    vek: cislo(personal.age),
    // Počet dětí je počet vyplněných karet – nemůže se rozejít s jejich výčtem.
    deti_pocet: rozdelSkupinu(children.children_list).length,
    deti_nejmladsi_vek: vekyDeti(children.children_list).sort((a, b) => a - b)[0],
    // Analýza se neptá, jestli by domácnost vyšla z příjmu partnera. Jistě to
    // víme jen u samoživitelů – jinde necháváme prázdné, ať se nic nedomýšlí.
    partner_prijem: personal.family_status === 'Samoživitel/ka' ? 'ne' : undefined,

    // — zdraví a životní styl —
    vyska: cislo(personal.height),
    vaha: cislo(personal.weight),
    lecba: kody(personal.treatment, 'personal', 'treatment', LECBA),
    rodinna_anamneza: kody(personal.family_history, 'personal', 'family_history', ANAMNEZA),
    sporty: kody(personal.sports, 'personal', 'sports', SPORTY),
    sporty_uroven: UROVEN_SPORTU[personal.sports_level],

    // — stávající pojistka —
    ma_zp: ANO_NE_NEVIM[cover.existing_policy],
    zp_spokojenost: ZNALOST_POJISTKY[cover.existing_policy_known],
  }
}

/**
 * Vyhodnocení analýzy pro poradce. Bez čistého příjmu nemá výpočet z čeho
 * vyjít (všechny částky by vyšly nulové), proto radši nic než falešná čísla.
 */
export function vyhodnotAnalyzu(a: AnalyzaOdpovedi): Recommendation | null {
  const odpovedi = naDotaznikoveOdpovedi(a)
  if (!odpovedi.prijem_cisty) return null
  const vysledek = computeRecommendation(odpovedi)

  // Klient si vybral jen úrazovou větev – poradce to musí vidět jako první,
  // protože nemoc (hlavní příčina invalidit) mu zůstává nekrytá a podle
  // zákona o distribuci pojištění patří do záznamu, že o tom ví.
  if (a.income?.cover_scope === JEN_URAZ) {
    return {
      ...vysledek,
      flags: [
        'Chce jen úrazové pojištění – nemoc zůstává nekrytá. Probrat a zapsat, že o tom ví.',
        ...vysledek.flags,
      ],
    }
  }
  return vysledek
}
