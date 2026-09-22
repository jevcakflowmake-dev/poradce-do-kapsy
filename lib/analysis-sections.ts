import {
  Shield, Home, Clock, Baby, TrendingUp, Building2, UserCircle, Briefcase,
} from 'lucide-react'

/**
 * Jediná definice finanční analýzy – sdílí ji veřejný formulář na /analyza
 * i verze pro přihlášené na /dashboard/analyza. Když se tady přidá otázka,
 * objeví se na obou místech a poradce ji uvidí v detailu klienta.
 */

export type QuestionType = 'text' | 'number' | 'select' | 'checkbox' | 'group'

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

  // — jen pro typ 'group' (opakovatelná skupina, např. děti) —
  /** Otázky, které se vyplňují u každé položky. Podmínky uvnitř zatím neumíme. */
  itemQuestions?: Question[]
  /** Jak se jmenuje jedna položka, např. „Dítě“ → nadpis „Dítě 1“. */
  itemLabel?: string
  /** Popisek tlačítka, kterým se přidává další položka. */
  addLabel?: string
}

/** Jedna položka opakovatelné skupiny: { id podotázky: hodnota }. */
export type GroupItem = Record<string, string>

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

/**
 * Opakovatelná skupina se ukládá jako JSON do jedné odpovědi – tabulka
 * `analysis_responses` tak zůstává beze změny (jeden řádek na otázku).
 * Rozbitý nebo cizí obsah radši zahodíme, než aby spadl formulář.
 */
export function rozdelSkupinu(ulozeno: string | undefined): GroupItem[] {
  if (!ulozeno) return []
  try {
    const data: unknown = JSON.parse(ulozeno)
    if (!Array.isArray(data)) return []
    return data.filter((x): x is GroupItem => Boolean(x) && typeof x === 'object' && !Array.isArray(x))
  } catch {
    return []
  }
}

export function spojSkupinu(polozky: GroupItem[]): string {
  return polozky.length > 0 ? JSON.stringify(polozky) : ''
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
    // Dvě větve podle `housing_situation`: kdo hypotéku má, řeší ji a případné
    // refinancování; kdo ne, řeší plánovanou koupi. Nikdo nedostane obojí.
    questions: [
      { id: 'housing_situation', label: 'Jak teď bydlíte?', type: 'select', options: ['Ve vlastním s hypotékou', 'Ve vlastním bez hypotéky', 'V nájmu', 'U rodiny nebo jinak'] },

      // — stávající hypotéka —
      {
        id: 'mortgage_balance',
        label: 'Kolik na hypotéce zbývá doplatit? (Kč)',
        type: 'number',
        placeholder: '2 500 000',
        help: 'Podle zbývajícího dluhu počítáme, kolik je potřeba zajistit pro případ invalidity nebo smrti.',
        showIf: { id: 'housing_situation', value: ['Ve vlastním s hypotékou'] },
      },
      {
        id: 'mortgage_payment',
        label: 'Jakou máte měsíční splátku? (Kč)',
        type: 'number',
        placeholder: '18 000',
        showIf: { id: 'housing_situation', value: ['Ve vlastním s hypotékou'] },
      },
      {
        id: 'mortgage_rate',
        label: 'Jakou máte úrokovou sazbu? (% ročně)',
        type: 'number',
        placeholder: '4,9',
        help: 'Když ji nevíte zpaměti, napište odhad nebo nechte prázdné – dohledám ji ve smlouvě.',
        showIf: { id: 'housing_situation', value: ['Ve vlastním s hypotékou'] },
      },
      {
        id: 'mortgage_fixation',
        label: 'Kdy vám končí fixace?',
        type: 'select',
        options: ['Do roka', 'Za 1–2 roky', 'Za 3 a více let', 'Nevím'],
        help: 'Konec fixace je jediná chvíle, kdy jde sazba změnit bez sankce.',
        showIf: { id: 'housing_situation', value: ['Ve vlastním s hypotékou'] },
      },
      {
        id: 'mortgage_bank',
        label: 'U které banky hypotéku máte?',
        type: 'text',
        placeholder: 'Česká spořitelna, Komerční banka…',
        showIf: { id: 'housing_situation', value: ['Ve vlastním s hypotékou'] },
      },
      {
        id: 'refinance_interest',
        label: 'Chcete se podívat na refinancování?',
        type: 'select',
        options: ['Ano, zajímá mě to', 'Ne, jsem spokojený/á', 'Nevím – řekněte mi, jestli se to vyplatí'],
        help: 'U starší sazby nebo před koncem fixace to bývá nejrychlejší způsob, jak snížit splátku.',
        showIf: { id: 'housing_situation', value: ['Ve vlastním s hypotékou'] },
      },

      // — plánovaná koupě —
      {
        id: 'plan_mortgage',
        label: 'Plánujete koupi vlastního bydlení?',
        type: 'select',
        options: ['Ano', 'Možná v budoucnu', 'Ne'],
        showIf: { id: 'housing_situation', value: ['Ve vlastním bez hypotéky', 'V nájmu', 'U rodiny nebo jinak'] },
      },
      {
        id: 'property_type',
        label: 'Co chcete řešit?',
        type: 'select',
        options: ['Byt', 'Dům', 'Pozemek', 'Rekonstrukci', 'Jiné'],
        showIf: { id: 'plan_mortgage', value: ['Ano', 'Možná v budoucnu'] },
      },
      {
        id: 'property_price',
        label: 'Odhadem za kolik? (Kč)',
        type: 'number',
        placeholder: '5 000 000',
        help: 'Stačí hrubý odhad. Podle ceny a vašich úspor se pozná, jakou hypotéku budete potřebovat.',
        showIf: { id: 'plan_mortgage', value: ['Ano', 'Možná v budoucnu'] },
      },
      {
        id: 'mortgage_timeline',
        label: 'Kdy chcete hypotéku řešit?',
        type: 'select',
        options: ['Do 6 měsíců', 'Do 1 roku', 'Do 2 let', 'Do 5 let', 'Nevím'],
        showIf: { id: 'plan_mortgage', value: ['Ano', 'Možná v budoucnu'] },
      },
      {
        id: 'mortgage_location',
        label: 'Kde to má být?',
        type: 'text',
        placeholder: 'Praha, Brno, okolí…',
        showIf: { id: 'plan_mortgage', value: ['Ano', 'Možná v budoucnu'] },
      },
      {
        id: 'saving_for_mortgage',
        label: 'Spoříte už na vlastní zdroje?',
        type: 'select',
        options: ['Ano', 'Ne'],
        help: 'Banka obvykle chce 10–20 % z ceny z vlastní kapsy.',
        showIf: { id: 'plan_mortgage', value: ['Ano', 'Možná v budoucnu'] },
      },
      {
        id: 'own_funds',
        label: 'Kolik už máte naspořeno? (Kč)',
        type: 'number',
        placeholder: '600 000',
        showIf: { id: 'saving_for_mortgage', value: ['Ano'] },
      },
      {
        id: 'monthly_saving',
        label: 'Kolik byste měsíčně dokázali odkládat? (Kč)',
        type: 'number',
        placeholder: '10 000',
        help: 'Podle toho spočítáme, za jak dlouho na vlastní zdroje dosáhnete.',
        showIf: { id: 'saving_for_mortgage', value: ['Ne'] },
      },
    ],
  },
  {
    id: 'retirement',
    title: 'Příprava na důchod',
    icon: Clock,
    color: 'bg-navy',
    // Na DIP a penzijní spoření se ptá sekce Investice (`tax_advantaged`),
    // tady se schválně neopakují.
    questions: [
      { id: 'retirement_age', label: 'V kolika letech byste chtěli přestat pracovat?', type: 'number', placeholder: '65', help: 'Podle toho víme, kolik let na to ještě máte. Řádný důchodový věk dnes vychází kolem 65 let.' },
      { id: 'desired_pension', label: 'Jakou rentu byste chtěli mít? (Kč měsíčně)', type: 'number', placeholder: '30 000', help: 'V dnešních penězích – přepočet na budoucí hodnotu a srovnání se státním důchodem udělám já.' },
      { id: 'retirement_saved', label: 'Kolik už máte na důchod odloženo celkem? (Kč)', type: 'number', placeholder: '250 000', help: 'Penzijko, investice, spoření – všechno dohromady. Stačí odhad.' },
      { id: 'current_savings', label: 'Kolik si na důchod odkládáte teď měsíčně? (Kč)', type: 'number', placeholder: '1 000' },
      { id: 'monthly_pension_budget', label: 'Kolik byste si na důchod dokázali odkládat? (Kč)', type: 'number', placeholder: '3 000', help: 'Kdyby to šlo víc než dnes – ať víme, s čím se dá počítat.' },
      { id: 'employer_pension', label: 'Přispívá vám zaměstnavatel na penzijní spoření?', type: 'select', options: ['Ano', 'Ne', 'Nevím', 'Nejsem zaměstnanec'], help: 'Příspěvek od zaměstnavatele je peníze zadarmo a spousta lidí ho nevyužívá.' },
      { id: 'retirement_other_income', label: 'Počítáte v důchodu s dalším příjmem?', type: 'checkbox', options: ['Pronájem nemovitosti', 'Prodej nemovitosti', 'Dědictví', 'Firma nebo podíl ve firmě', 'Ne, s ničím dalším'] },
    ],
  },
  {
    id: 'children',
    title: 'Děti',
    icon: Baby,
    color: 'bg-navy',
    // Opakovatelná skupina: u každého dítěte se ptáme zvlášť. Dřív tu byl
    // počet a věky jako text oddělený čárkou – z toho se nedalo počítat.
    questions: [
      {
        id: 'children_list',
        label: 'Vaše děti',
        type: 'group',
        itemLabel: 'Dítě',
        addLabel: 'Přidat dítě',
        help: 'U každého dítěte se ptáme zvlášť – dvouleté a sedmnáctileté potřebují něco jiného. Když děti nemáte, pokračujte dál.',
        itemQuestions: [
          { id: 'name', label: 'Jméno nebo přezdívka', type: 'text', placeholder: 'Adam' },
          { id: 'age', label: 'Věk', type: 'number', placeholder: '6' },
          { id: 'insure', label: 'Chcete ho pojistit?', type: 'select', options: ['Ano', 'Ne', 'Už je pojištěné'] },
          { id: 'saving', label: 'Spoříte mu už?', type: 'select', options: ['Ano', 'Ne'] },
          { id: 'monthly', label: 'Kolik měsíčně (Kč)', type: 'number', placeholder: '1 000' },
        ],
      },
      { id: 'children_notes', label: 'Chcete k dětem něco doplnit?', type: 'text', placeholder: 'nepovinné' },
    ],
  },
  {
    id: 'investing',
    title: 'Investice',
    icon: TrendingUp,
    color: 'bg-navy',
    questions: [
      { id: 'investment_goal', label: 'Na co si chcete investovat?', type: 'select', options: ['Na rentu v důchodu', 'Na děti', 'Na bydlení', 'Rezerva navíc', 'Zatím nevím, chci peníze jen zhodnotit'], help: 'Od cíle se odvíjí, na jak dlouho peníze odkládáte a jaké riziko dává smysl.' },
      { id: 'investment_horizon', label: 'Za jak dlouho budete peníze potřebovat?', type: 'select', options: ['1–3 roky', '3–5 let', '5–10 let', '10+ let'] },
      { id: 'monthly_invest', label: 'Kolik chcete investovat měsíčně? (Kč)', type: 'number', placeholder: '3 000' },
      {
        id: 'lump_sum_invest',
        label: 'Kolik chcete investovat jednorázově? (Kč)',
        type: 'number',
        placeholder: '200 000',
        help: 'Třeba z úspor, prodeje nebo mimořádného příjmu. Když nic takového nemáte, nechte prázdné.',
      },
      { id: 'investing_experience', label: 'Jakou máte zkušenost s investováním?', type: 'select', options: ['Žádnou, začínám', 'Něco málo jsem zkusil/a', 'Investuju několik let', 'Investování rozumím dobře'] },
      { id: 'risk_tolerance', label: 'Jak moc vám vadí, když hodnota kolísá?', type: 'select', options: ['Nechci ztrátu, i za cenu nižšího výnosu', 'Menší výkyvy snesu', 'Počítám s výkyvy kvůli vyššímu výnosu', 'Výkyvy mi nevadí, jdu za výnosem'], help: 'Nejde o to, co je správně – jde o to, u čeho budete v klidu spát.' },
      { id: 'current_investments', label: 'Investujete už teď?', type: 'select', options: ['Ne, začínám od nuly', 'Ano, podílové fondy', 'Ano, ETF nebo akcie', 'Ano, krypto', 'Ano, víc věcí dohromady'] },
      { id: 'tax_advantaged', label: 'Máte dlouhodobý investiční produkt (DIP) nebo penzijní spoření?', type: 'select', options: ['Nemám ani jedno', 'Mám penzijní spoření', 'Mám DIP', 'Mám obojí', 'Nevím'], help: 'U obojího jde část vkladů odečíst z daní. Když je nemáte, bývá to první věc, která se vyplatí.' },
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
