import {
  Shield, Home, Clock, Baby, TrendingUp, Building2, UserCircle,
} from 'lucide-react'

/**
 * Jediná definice finanční analýzy – sdílí ji veřejný formulář na /analyza
 * i verze pro přihlášené na /dashboard/analyza. Když se tady přidá otázka,
 * objeví se na obou místech a poradce ji uvidí v detailu klienta.
 */

export type QuestionType = 'text' | 'number' | 'select' | 'checkbox'

export interface Question {
  id: string
  label: string
  type: QuestionType
  placeholder?: string
  options?: string[]
}

export interface Section {
  id: string
  title: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  color: string
  questions: Question[]
}

/** Sekce, která sbírá zvláštní kategorie údajů dle čl. 9 GDPR. */
export const HEALTH_SECTION_ID = 'personal'

/** Odpovědi jedné sekce: { question_id: hodnota }. */
export type SectionData = Record<string, string>

export const SECTIONS: Section[] = [
  {
    id: 'income',
    title: 'Zajištění příjmů',
    icon: Shield,
    color: 'from-[#162459] to-[#243471]',
    questions: [
      { id: 'employment', label: 'Jaký je váš pracovní poměr?', type: 'select', options: ['Zaměstnanec', 'OSVČ', 'Kombinace', 'Student', 'Důchodce'] },
      { id: 'monthly_income', label: 'Čistý měsíční příjem (Kč)', type: 'number', placeholder: '35 000' },
      { id: 'income_drop', label: 'Když vám klesne příjem na 60 %, kolik Kč chcete dostat, aby peníze nebyl problém?', type: 'number', placeholder: '20 000' },
      { id: 'permanent_consequences', label: 'V případě trvalých následků chcete být zajištěn/a?', type: 'select', options: ['Ano', 'Ne'] },
      { id: 'invalidity', label: 'V případě invalidity chcete být zajištěn/a?', type: 'select', options: ['Ano', 'Ne'] },
      { id: 'serious_illness', label: 'V případě závažné nemoci chcete být zajištěn/a?', type: 'select', options: ['Ano', 'Ne'] },
      { id: 'long_term_care', label: 'Chcete být zajištěn/a v případě dlouhodobé péče?', type: 'select', options: ['Ano', 'Ne'] },
      { id: 'death_coverage', label: 'V případě smrti chcete mít zajištěné splacení závazku?', type: 'select', options: ['Ano', 'Ne'] },
      { id: 'death_coverage_amount', label: 'Pokud ano, kolik Kč je potřeba na splacení závazků?', type: 'number', placeholder: '1 000 000' },
      { id: 'monthly_budget', label: 'Kolik Kč jste ochotný/á platit za tento produkt měsíčně?', type: 'number', placeholder: '1 500' },
      { id: 'preferred_companies', label: 'Máte nějaké společnosti, které preferujete?', type: 'checkbox', options: ['ČPP', 'Kooperativa', 'Allianz', 'MetLife', 'Generali', 'NN', 'Uniqa', 'Všechny'] },
    ],
  },
  {
    id: 'housing',
    title: 'Bydlení',
    icon: Home,
    color: 'from-[#009EE2] to-[#0079AD]',
    questions: [
      { id: 'has_mortgage', label: 'Máte hypotéku?', type: 'select', options: ['Ano', 'Ne'] },
      { id: 'plan_mortgage', label: 'Pokud ne, plánujete ji řešit?', type: 'select', options: ['Ano', 'Ne', 'Možná v budoucnu'] },
      { id: 'mortgage_amount', label: 'Jakou výši úvěru chcete?', type: 'number', placeholder: '3 000 000' },
      { id: 'property_type', label: 'Jakou nemovitost chcete koupit?', type: 'select', options: ['Byt', 'Dům', 'Pozemek', 'Jiné'] },
      { id: 'mortgage_timeline', label: 'Za jak dlouho plánujete koupi?', type: 'select', options: ['Do 6 měsíců', 'Do 1 roku', 'Do 2 let', 'Do 5 let', 'Nevím'] },
      { id: 'mortgage_location', label: 'Kde chcete nemovitost koupit?', type: 'text', placeholder: 'Praha, Brno, ...' },
    ],
  },
  {
    id: 'retirement',
    title: 'Příprava na důchod',
    icon: Clock,
    color: 'from-[#162459] to-[#243471]',
    questions: [
      { id: 'current_savings', label: 'Kolik si aktuálně odkládáte na důchod? (Kč/měsíc)', type: 'number', placeholder: '500' },
      { id: 'pension_gap', label: 'Když byste od zítra pobírali důchod 9 000 Kč, kolik Kč byste ještě potřebovali k tomu?', type: 'number', placeholder: '15 000' },
      { id: 'monthly_pension_budget', label: 'Kolik si můžete měsíčně odkládat na důchod? (Kč)', type: 'number', placeholder: '2 000' },
    ],
  },
  {
    id: 'children',
    title: 'Děti',
    icon: Baby,
    color: 'from-[#009EE2] to-[#0079AD]',
    questions: [
      { id: 'children_count', label: 'Kolik máte dětí?', type: 'number', placeholder: '0' },
      { id: 'children_ages', label: 'Jaký je jejich věk? (oddělte čárkou)', type: 'text', placeholder: '5, 8, 12' },
      { id: 'children_insurance', label: 'Přejete si je pojistit v případě úrazu/nemoci?', type: 'select', options: ['Ano', 'Ne'] },
      { id: 'children_savings', label: 'Přejete si spořit dítěti?', type: 'select', options: ['Ano', 'Ne'] },
      { id: 'children_monthly', label: 'Kolik můžete měsíčně spořit? (Kč)', type: 'number', placeholder: '1 000' },
      { id: 'children_notes', label: 'Poznámky', type: 'text', placeholder: 'Další informace...' },
    ],
  },
  {
    id: 'investing',
    title: 'Investice',
    icon: TrendingUp,
    color: 'from-[#162459] to-[#243471]',
    questions: [
      { id: 'investing_experience', label: 'Zkušenosti s investováním', type: 'select', options: ['Žádné', 'Začátečník', 'Mírně pokročilý', 'Pokročilý'] },
      { id: 'risk_tolerance', label: 'Tolerance k riziku', type: 'select', options: ['Konzervativní', 'Vyvážený', 'Dynamický', 'Agresivní'] },
      { id: 'investment_horizon', label: 'Investiční horizont', type: 'select', options: ['1–3 roky', '3–5 let', '5–10 let', '10+ let'] },
      { id: 'monthly_invest', label: 'Kolik měsíčně chcete investovat (Kč)', type: 'number', placeholder: '3 000' },
      { id: 'current_investments', label: 'Stávající investice', type: 'select', options: ['Nemám žádné', 'Podílové fondy', 'ETF / akcie', 'Krypto', 'Kombinace'] },
    ],
  },
  {
    id: 'property',
    title: 'Pojištění majetku',
    icon: Building2,
    color: 'from-[#009EE2] to-[#0079AD]',
    questions: [
      { id: 'has_car', label: 'Vlastníte auto?', type: 'select', options: ['Ano', 'Ne'] },
      { id: 'car_insurance', label: 'Jak jej máte pojištěné?', type: 'select', options: ['Povinné ručení', 'Povinné ručení + havarijní', 'Nemám pojištění', 'Nevlastním auto'] },
      { id: 'car_recalculate', label: 'Chcete přepočítat stávající pojištění?', type: 'select', options: ['Ano', 'Ne'] },
      { id: 'has_property', label: 'Vlastníte nemovitost?', type: 'select', options: ['Ano', 'Ne'] },
      { id: 'property_type', label: 'Jakou nemovitost?', type: 'select', options: ['Byt', 'Dům', 'Chata/chalupa', 'Více nemovitostí', 'Nevlastním'] },
      { id: 'property_insured', label: 'Máte ji pojištěnou?', type: 'select', options: ['Ano', 'Ne'] },
      { id: 'want_property_insurance', label: 'Přejete si ji pojistit?', type: 'select', options: ['Ano', 'Ne'] },
      { id: 'property_value', label: 'Pokud ano, jakou má hodnotu? (Kč)', type: 'number', placeholder: '3 000 000' },
      { id: 'combined_insurance', label: 'Přejete si pojistit nemovitost i domácnost dohromady?', type: 'select', options: ['Ano', 'Ne'] },
      { id: 'property_notes', label: 'Poznámky', type: 'text', placeholder: 'Další informace...' },
    ],
  },
  {
    id: 'personal',
    title: 'Osobní údaje',
    icon: UserCircle,
    color: 'from-[#162459] to-[#0e1a3d]',
    questions: [
      { id: 'full_name', label: 'Jméno a příjmení', type: 'text', placeholder: 'Jan Novák' },
      { id: 'email', label: 'E-mail', type: 'text', placeholder: 'jan@email.cz' },
      { id: 'phone', label: 'Telefon', type: 'text', placeholder: '+420 777 123 456' },
      { id: 'age', label: 'Věk', type: 'number', placeholder: '35' },
      // Dřív se ptal úvodní wizard na /onboarding; ten je zrušený, ale poradce
      // rodinný stav vidí v panelu a počítá se do skóre – proto je tady.
      { id: 'family_status', label: 'Rodinná situace', type: 'select', options: ['Single', 'S partnerem/kou', 'Rodina s dětmi', 'Samoživitel/ka'] },
      { id: 'height', label: 'Výška (cm)', type: 'number', placeholder: '178' },
      { id: 'weight', label: 'Váha (kg)', type: 'number', placeholder: '80' },
      { id: 'serious_illness', label: 'Vážné nemoci za posledních 5 let?', type: 'text', placeholder: 'Žádné / popište...' },
      { id: 'injury', label: 'Úraz za posledních 5 let?', type: 'text', placeholder: 'Žádný / popište...' },
      { id: 'occupation', label: 'Jaké je vaše zaměstnání?', type: 'text', placeholder: 'Účetní, řidič, IT...' },
    ],
  },
]

/** Součet všech otázek napříč sekcemi – pro ukazatel postupu. */
export const TOTAL_QUESTIONS = SECTIONS.reduce((n, s) => n + s.questions.length, 0)

/** Kolik procent otázek sekce je vyplněno. */
export function sectionProgress(section: Section, answers: SectionData | undefined): number {
  if (!section.questions.length) return 0
  const answered = section.questions.filter(q => answers?.[q.id]).length
  return Math.round((answered / section.questions.length) * 100)
}
