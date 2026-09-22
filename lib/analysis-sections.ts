import {
  Shield, Home, Clock, Baby, TrendingUp, Building2, UserCircle, Briefcase,
} from 'lucide-react'

/**
 * Jediná definice finanční analýzy – sdílí ji veřejný formulář na /analyza
 * i verze pro přihlášené na /dashboard/analyza. Když se tady přidá otázka,
 * objeví se na obou místech a poradce ji uvidí v detailu klienta.
 */

export type QuestionType = 'text' | 'number' | 'select' | 'checkbox'

/**
 * Podmínka zobrazení. Odkazuje se na otázku ve STEJNÉ sekci – napříč sekcemi
 * schválně ne: průvodce vyplňuje sekce po sobě a otázka by se pak mohla
 * schovávat podle něčeho, co uživatel ještě neviděl.
 */
export interface Podminka {
  id: string
  /** Zobraz, když je odpověď některá z těchto hodnot. */
  value: string[]
}

export interface Question {
  id: string
  label: string
  type: QuestionType
  placeholder?: string
  options?: string[]
  /** Krátké „proč se ptáme“ pod otázkou. */
  help?: string
  showIf?: Podminka
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

/**
 * Oddělovač více zaškrtnutých hodnot. Čárka nestačí – řada voleb ji má přímo
 * v textu („Lyže, snowboard“), takže by se jedna odpověď rozpadla na dvě
 * a zaškrtnutí ani podmínky by nesedely. Znak U+001F se v textu nevyskytuje.
 */
export const ODDELOVAC = '\u001F'

/**
 * Rozloží uloženou hodnotu na jednotlivé volby.
 * `options` pomáhá s hodnotami uloženými ještě přes čárku: když se celý řetězec
 * rovná některé volbě, je to jedna odpověď, ne seznam.
 */
export function rozdelHodnoty(ulozeno: string | undefined, options?: string[]): string[] {
  if (!ulozeno) return []
  if (ulozeno.includes(ODDELOVAC)) return ulozeno.split(ODDELOVAC).filter(Boolean)
  // Bez seznamu voleb nemáme jak poznat, jestli je čárka oddělovač, nebo součást
  // textu („Lyže, snowboard“) – tak nehádáme a bereme to jako jednu hodnotu.
  if (!options) return [ulozeno]
  if (options.includes(ulozeno)) return [ulozeno]
  return ulozeno.split(',').map((x) => x.trim()).filter(Boolean)
}

export function spojHodnoty(hodnoty: string[]): string {
  return hodnoty.join(ODDELOVAC)
}

/** Hodnota pro člověka – víc voleb spojených čárkou. Starší zápis projde beze změny. */
export function zobrazHodnotu(ulozeno: string | undefined): string {
  return rozdelHodnoty(ulozeno).join(', ')
}

/** Má se otázka zobrazit? U více zaškrtnutých stačí, když se hodnoty protnou. */
export function otazkaViditelna(q: Question, odpovedi: SectionData | undefined): boolean {
  if (!q.showIf) return true
  const rizeni = q.showIf.id
  const volby = SECTIONS.flatMap((s) => s.questions).find((x) => x.id === rizeni)?.options
  const casti = rozdelHodnoty(odpovedi?.[rizeni], volby)
  return q.showIf.value.some((v) => casti.includes(v))
}

/** Otázky sekce, které jsou při daných odpovědích vidět. */
export function viditelneOtazky(section: Section, odpovedi: SectionData | undefined): Question[] {
  return section.questions.filter((q) => otazkaViditelna(q, odpovedi))
}

/**
 * Zahodí odpovědi na otázky, které se mezitím schovaly – jinak by poradci
 * dorazily třeba OSVČ údaje u člověka, co si mezitím přepnul na zaměstnance.
 * Běží ve smyčce kvůli zanořeným podmínkám (OSVČ → nemocenská → základ).
 */
export function uklidSkryteOdpovedi(section: Section, odpovedi: SectionData): SectionData {
  let aktualni = odpovedi
  for (let i = 0; i < 5; i++) {
    const ocistene: SectionData = {}
    for (const q of section.questions) {
      if (otazkaViditelna(q, aktualni) && aktualni[q.id] !== undefined) {
        ocistene[q.id] = aktualni[q.id]
      }
    }
    if (Object.keys(ocistene).length === Object.keys(aktualni).length) return ocistene
    aktualni = ocistene
  }
  return aktualni
}

export const SECTIONS: Section[] = [
  {
    id: 'income',
    title: 'Práce a příjem',
    icon: Briefcase,
    color: 'bg-navy',
    // Sloučeno s dotazníkem „Zajištění příjmu“ (src/questionnaires). Zdravotní
    // otázky odtamtud jsou v sekci `personal` – souhlas se zpracováním údajů
    // o zdraví je navázaný na ni (HEALTH_SECTION_ID). Hypotéka zůstává
    // v Bydlení, věk a míry v Osobních údajích, děti v sekci Děti.
    questions: [
      { id: 'employment', label: 'Jaký je váš pracovní poměr?', type: 'select', options: ['Zaměstnanec', 'OSVČ', 'Vlastní firma (s.r.o.)', 'Kombinace', 'Student', 'Důchodce'] },
      { id: 'monthly_income', label: 'Čistý měsíční příjem (Kč)', type: 'number', placeholder: '35 000', help: 'U podnikání berte to, co si reálně vyplácíte pro sebe, ne obrat.' },
      { id: 'income_variable', label: 'Jak velkou část příjmu tvoří odměny, provize nebo bonusy?', type: 'select', options: ['Skoro žádnou, mám pevný plat', 'Do třetiny', 'Většinu – když nepracuji, nevydělávám'] },
      {
        id: 'sick_pay_osvc',
        label: 'Platíte si dobrovolné nemocenské pojištění?',
        type: 'select',
        options: ['Ano', 'Ne', 'Nevím'],
        help: 'Bez něj vám stát při nemoci neplatí vůbec nic. Většina OSVČ ho nemá.',
        showIf: { id: 'employment', value: ['OSVČ', 'Vlastní firma (s.r.o.)', 'Kombinace'] },
      },
      {
        id: 'sick_pay_base',
        label: 'Z jakého měsíčního základu si nemocenské platíte? (Kč)',
        type: 'number',
        help: 'Najdete na přehledu pro ČSSZ. Když nevíte, nechte prázdné.',
        showIf: { id: 'sick_pay_osvc', value: ['Ano'] },
      },
      {
        id: 'social_contributions',
        label: 'Platíte na sociálním pojištění spíš minimum, nebo víc?',
        type: 'select',
        options: ['Minimum / paušální daň', 'Více než minimum', 'Nevím'],
        help: 'Kdo platí minimum, má od státu při invaliditě jen několik tisíc měsíčně.',
        showIf: { id: 'employment', value: ['OSVČ', 'Vlastní firma (s.r.o.)', 'Kombinace'] },
      },
      {
        id: 'employer_benefits',
        label: 'Co vám zaměstnavatel při nemoci dává navíc?',
        type: 'checkbox',
        options: ['Sick days', 'Doplatek nemocenské do plné mzdy', 'Příspěvek na životní pojištění', 'Nic z toho / nevím'],
        showIf: { id: 'employment', value: ['Zaměstnanec', 'Kombinace'] },
      },
      { id: 'work_years', label: 'Kolik let celkem pracujete nebo podnikáte?', type: 'select', options: ['Méně než 5 let', '5–15 let', 'Více než 15 let'], help: 'Nárok na invalidní důchod od státu závisí na odpracovaných letech.' },
      { id: 'work_risk', label: 'Co nejlépe vystihuje vaši práci?', type: 'select', options: ['Převážně u počítače / v kanceláři', 'Hodně na nohou, ale bez fyzické námahy', 'Fyzická práce, řemeslo, výroba', 'Riziková (výšky, těžké stroje, hasiči, policie…)', 'Profesionální řidič / hodně za volantem'], help: 'Určuje, jaké zranění by vás vyřadilo z práce – a jak pojišťovna hodnotí riziko.' },
      { id: 'essential_expenses', label: 'Kolik měsíčně musí vaše domácnost nutně zaplatit? (Kč)', type: 'number', placeholder: '35 000', help: 'Bydlení, energie, jídlo, děti, auto, splátky, pojistky. Bez dovolených a zábavy.' },
      { id: 'income_drop', label: 'Když vám klesne příjem na 60 %, kolik Kč chcete dostat, aby peníze nebyl problém?', type: 'number', placeholder: '20 000' },
      { id: 'reserve_months', label: 'Jak dlouho byste vydrželi z úspor, kdyby vám přestal chodit příjem?', type: 'select', options: ['Méně než měsíc', '1–3 měsíce', '3–6 měsíců', 'Více než 6 měsíců'], help: 'Podle toho nastavíme, od kterého dne nemoci má pojistka platit. Delší rezerva = levnější pojistka.' },
      { id: 'other_loans', label: 'Ostatní úvěry a půjčky – kolik zbývá doplatit celkem? (Kč)', type: 'number', placeholder: '0', help: 'Auto, spotřebitelské úvěry, kreditky. Hypotéku řešíme v sekci Bydlení.' },
    ],
  },
  {
    id: 'income_cover',
    title: 'Co chcete zajistit',
    icon: Shield,
    color: 'bg-navy',
    // Druhá půlka původní sekce „Zajištění příjmů“. Podmínky se vyhodnocují
    // v rámci sekce, proto tu musí zůstat i otázka, na kterou se odkazují.
    questions: [
      { id: 'permanent_consequences', label: 'V případě trvalých následků chcete být zajištěn/a?', type: 'select', options: ['Ano', 'Ne'] },
      { id: 'invalidity', label: 'V případě invalidity chcete být zajištěn/a?', type: 'select', options: ['Ano', 'Ne'] },
      { id: 'serious_illness', label: 'V případě závažné nemoci chcete být zajištěn/a?', type: 'select', options: ['Ano', 'Ne'] },
      { id: 'long_term_care', label: 'Chcete být zajištěn/a v případě dlouhodobé péče?', type: 'select', options: ['Ano', 'Ne'] },
      { id: 'death_coverage', label: 'V případě smrti chcete mít zajištěné splacení závazku?', type: 'select', options: ['Ano', 'Ne'] },
      {
        id: 'death_coverage_amount',
        label: 'Pokud ano, kolik Kč je potřeba na splacení závazků?',
        type: 'number',
        placeholder: '1 000 000',
        showIf: { id: 'death_coverage', value: ['Ano'] },
      },
      { id: 'biggest_fears', label: 'Čeho se v souvislosti s příjmem bojíte nejvíc?', type: 'checkbox', options: ['Být pár měsíců bez příjmu (nemoc, zlomenina)', 'Nikdy už nemoct pracovat (invalidita)', 'Vážná nemoc a náklady na léčbu', 'Že rodina zůstane bez mého příjmu natrvalo'], help: 'Vyberte, co na vás sedí. Podle toho dáme v pojistce největší váhu.' },
      { id: 'existing_policy', label: 'Máte už nějaké životní nebo úrazové pojištění?', type: 'select', options: ['Ano', 'Ne', 'Nevím / mám něco z dětství'] },
      {
        id: 'existing_policy_payment',
        label: 'Kolik za něj platíte měsíčně? (Kč)',
        type: 'number',
        placeholder: '800',
        showIf: { id: 'existing_policy', value: ['Ano'] },
      },
      {
        id: 'existing_policy_known',
        label: 'Víte, co přesně máte pojištěné?',
        type: 'select',
        options: ['Ano, vím přesně', 'Zhruba', 'Ne, podepsal/a jsem to a nevím'],
        showIf: { id: 'existing_policy', value: ['Ano'] },
      },
      { id: 'who_to_insure', label: 'Koho chcete řešit?', type: 'checkbox', options: ['Jen sebe', 'I partnera/ku', 'I děti'] },
      { id: 'monthly_budget', label: 'Kolik Kč jste ochotný/á platit za tento produkt měsíčně?', type: 'number', placeholder: '1 500' },
      { id: 'preferred_companies', label: 'Máte nějaké společnosti, které preferujete?', type: 'checkbox', options: ['ČPP', 'Kooperativa', 'Allianz', 'MetLife', 'Generali', 'NN', 'Uniqa', 'Všechny'] },
    ],
  },
  {
    id: 'housing',
    title: 'Bydlení',
    icon: Home,
    color: 'bg-navy',
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
    color: 'bg-navy',
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
    color: 'bg-navy',
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
    color: 'bg-navy',
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
    color: 'bg-navy',
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
    color: 'bg-navy',
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
      { id: 'smoking', label: 'Kouříte?', type: 'select', options: ['Ne, nikdy', 'Přestal/a jsem před více než rokem', 'Ano (včetně e-cigaret a nikotinových sáčků)'] },
      { id: 'treatment', label: 'Léčíte se s něčím, nebo berete pravidelně léky?', type: 'checkbox', options: ['Ne, jsem zdravý/á', 'Vysoký tlak, srdce, cholesterol', 'Cukrovka', 'Záda, klouby, páteř', 'Psychika (úzkosti, deprese, vyhoření)', 'Štítná žláza, hormony', 'Onkologické onemocnění (i vyléčené)', 'Něco jiného'], help: 'Nepotřebujeme detaily, jen orientaci. Vše je důvěrné.' },
      {
        id: 'treatment_other',
        label: 'Můžete stručně napsat, s čím se léčíte?',
        type: 'text',
        placeholder: 'nepovinné',
        showIf: { id: 'treatment', value: ['Něco jiného'] },
      },
      { id: 'serious_illness', label: 'Vážné nemoci za posledních 5 let?', type: 'text', placeholder: 'Žádné / popište...' },
      { id: 'injury', label: 'Úraz za posledních 5 let?', type: 'text', placeholder: 'Žádný / popište...' },
      { id: 'family_history', label: 'Objevilo se u rodičů nebo sourozenců některé z těchto onemocnění před 60. rokem?', type: 'checkbox', options: ['Ne / nevím o tom', 'Rakovina', 'Infarkt nebo mrtvice', 'Cukrovka', 'Roztroušená skleróza, Parkinson, Alzheimer'], help: 'Dědičná zátěž rozhoduje, jak moc posílit pojištění závažných nemocí.' },
      { id: 'sports', label: 'Jaké sporty děláte pravidelně?', type: 'checkbox', options: ['Žádné / jen procházky', 'Běh, kolo, plavání, fitness, míčové hry', 'Lyže, snowboard', 'Bojové sporty', 'Motorka, motokáry, závody', 'Horolezectví, ferraty, skialpinismus', 'Paragliding, potápění, rafting, kite', 'Jezdectví nebo jiný rizikový sport'], help: 'Některé sporty pojišťovny vylučují nebo zdražují. Lepší vědět předem.' },
      {
        id: 'sports_level',
        label: 'Na jaké úrovni sportujete?',
        type: 'select',
        options: ['Rekreačně', 'Registrovaně / závodně (amatér)', 'Profesionálně nebo za peníze'],
        showIf: { id: 'sports', value: ['Běh, kolo, plavání, fitness, míčové hry', 'Lyže, snowboard', 'Bojové sporty', 'Motorka, motokáry, závody', 'Horolezectví, ferraty, skialpinismus', 'Paragliding, potápění, rafting, kite', 'Jezdectví nebo jiný rizikový sport'] },
      },
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

/**
 * Popisek oblasti, kterou si klient v analýze vyplnil. `profiles.goals` drží
 * id sekcí (viz výše), takže název bere odsud – dřív měl vlastní slovník
 * (insurance, pension…), který se s id sekcí nepotkal a poradci se v tabulce
 * ukazovalo holé „income“. Starší hodnoty ze slovníku zůstávají kvůli datům
 * založeným před sjednocením.
 */
const STARE_OBLASTI: Record<string, string> = {
  insurance: 'Pojištění',
  pension: 'Důchod',
  invest: 'Investice',
  mortgage: 'Hypotéka',
  savings: 'Stavební spoření',
}

export function goalLabel(goal: string): string {
  return SECTIONS.find((s) => s.id === goal)?.title ?? STARE_OBLASTI[goal] ?? goal
}
