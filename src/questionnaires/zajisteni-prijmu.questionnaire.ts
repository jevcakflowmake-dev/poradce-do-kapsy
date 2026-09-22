/**
 * Poradce do kapsy – dotazník „Zajištění příjmu“
 *
 * POZOR, nemazat jako mrtvý kód. Samotné otázky se klientům už neukazují –
 * 22. 9. 2026 byly sloučené do analýzy (lib/analysis-sections.ts, sekce
 * `income`, `income_cover` a zdravotní část v `personal`). Tenhle soubor
 * zůstává kvůli `computeRecommendation()` a `ASSUMPTIONS` níž: ten výpočet
 * částek a flagů pro poradce se má napojit na odpovědi z analýzy.
 *
 * Co k tomu bude potřeba: převodní vrstva z odpovědí analýzy na tvar `Answers`.
 * Klíče ani hodnoty nesedí 1:1 – analýza má `employment: 'OSVČ'`, tady je
 * `typ_prace: 'osvc'`; `reserve_months: 'Méně než měsíc'` vs `rezerva: 'do_1m'`.
 * Část vstupů leží v jiných sekcích (hypotéka v `housing`, věk a míry
 * v `personal`, děti v `children`).
 *
 * Tabulky questionnaire_definitions / questionnaires / questionnaire_reviews
 * a scripts/seed-questionnaire.ts zůstávají z téhož důvodu.
 *
 * Klientská (B2C) verze: jednoduché otázky, vykání, bez poradenského žargonu.
 * Každá otázka nese `informs` = která rizika z odpovědi počítáme,
 * aby šlo v UI ukázat „proč se na to ptáme“ a aby výpočet doporučení
 * měl jasnou datovou stopu.
 *
 * Struktura je záměrně čistě datová (žádný React), aby se dala uložit
 * do Supabase jako JSONB verze dotazníku a renderovat generickým formulářem.
 */

export type Risk =
  | 'denni_odskodne'      // pracovní neschopnost
  | 'hospitalizace'
  | 'invalidita'          // 1.–3. stupeň
  | 'zavazna_onemocneni'
  | 'smrt'
  | 'trvale_nasledky'
  | 'obecne';             // riziková skupina, přirážky, výluky

export type QuestionType =
  | 'single'    // radio / select
  | 'multi'     // checkboxy
  | 'yesno'
  | 'number'
  | 'currency'  // Kč, celé číslo
  | 'slider'
  | 'text'
  | 'rank'      // seřazení priorit
  | 'upload';

export interface Option {
  value: string;
  label: string;
  /** volitelný text pod možností */
  hint?: string;
}

export interface Condition {
  key: string;
  op: 'eq' | 'neq' | 'in' | 'gt' | 'gte' | 'lt' | 'includes';
  value: string | number | string[] | boolean;
}

export interface Question {
  key: string;
  type: QuestionType;
  label: string;
  /** krátké vysvětlení „proč se ptáme“ – zobrazit pod otázkou nebo v tooltipu */
  help?: string;
  placeholder?: string;
  options?: Option[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  required?: boolean;
  /** zobrazit jen když platí VŠECHNY podmínky */
  showIf?: Condition[];
  informs: Risk[];
}

export interface Section {
  key: string;
  title: string;
  intro?: string;
  questions: Question[];
}

export interface Questionnaire {
  key: string;
  version: number;
  title: string;
  intro: string;
  estimatedMinutes: number;
  sections: Section[];
}

export const zajisteniPrijmuQuestionnaire: Questionnaire = {
  key: 'zajisteni_prijmu',
  version: 1,
  title: 'Zajištění příjmu',
  intro:
    'Za pár minut zjistíme, co by se stalo s vašimi financemi, kdybyste kvůli nemoci nebo úrazu nemohli pracovat – a co přesně potřebujete pojistit. Nepotřebujeme přesná čísla, stačí odhad.',
  estimatedMinutes: 8,

  sections: [
    // ------------------------------------------------------------------
    {
      key: 'zaklad',
      title: 'Něco o vás',
      questions: [
        {
          key: 'vek',
          type: 'number',
          label: 'Kolik je vám let?',
          min: 18,
          max: 70,
          unit: 'let',
          required: true,
          informs: ['obecne', 'invalidita', 'smrt'],
        },
        {
          key: 'pohlavi',
          type: 'single',
          label: 'Pohlaví',
          options: [
            { value: 'muz', label: 'Muž' },
            { value: 'zena', label: 'Žena' },
          ],
          required: true,
          informs: ['obecne'],
        },
        {
          key: 'partner',
          type: 'single',
          label: 'Žijete s partnerem / partnerkou?',
          options: [
            { value: 'ano_spolecne', label: 'Ano, máme společnou domácnost' },
            { value: 'ano_oddelene', label: 'Ano, ale finance máme oddělené' },
            { value: 'ne', label: 'Ne' },
          ],
          required: true,
          informs: ['smrt', 'invalidita', 'denni_odskodne'],
        },
        {
          key: 'partner_prijem',
          type: 'single',
          label: 'Vydržela by domácnost delší dobu jen z příjmu partnera/ky?',
          options: [
            { value: 'ano_pohodlne', label: 'Ano, bez větších změn' },
            { value: 'ano_s_omezenim', label: 'Ano, ale museli bychom hodně šetřit' },
            { value: 'ne', label: 'Ne, jsme závislí hlavně na mém příjmu' },
          ],
          showIf: [{ key: 'partner', op: 'eq', value: 'ano_spolecne' }],
          required: true,
          informs: ['denni_odskodne', 'invalidita', 'smrt'],
        },
        {
          key: 'deti_pocet',
          type: 'number',
          label: 'Kolik máte dětí, které na vás finančně závisí?',
          help: 'Počítejte i děti, které studují a ještě se neživí samy.',
          min: 0,
          max: 10,
          required: true,
          informs: ['smrt', 'invalidita'],
        },
        {
          key: 'deti_nejmladsi_vek',
          type: 'number',
          label: 'Kolik let je nejmladšímu dítěti?',
          help: 'Podle toho odhadneme, jak dlouho by rodina potřebovala váš příjem nahradit.',
          min: 0,
          max: 26,
          unit: 'let',
          showIf: [{ key: 'deti_pocet', op: 'gt', value: 0 }],
          required: true,
          informs: ['smrt'],
        },
        {
          key: 'planujete_deti',
          type: 'yesno',
          label: 'Plánujete v příštích letech (další) děti?',
          informs: ['smrt'],
        },
      ],
    },

    // ------------------------------------------------------------------
    {
      key: 'prace',
      title: 'Práce a příjem',
      intro: 'Nejdůležitější část. Podle ní víme, kolik vám při výpadku bude chybět.',
      questions: [
        {
          key: 'typ_prace',
          type: 'single',
          label: 'Jak vyděláváte?',
          options: [
            { value: 'zamestnanec', label: 'Jsem zaměstnanec/kyně' },
            { value: 'osvc', label: 'Podnikám jako OSVČ' },
            { value: 'jednatel', label: 'Mám vlastní firmu (s.r.o.), vyplácím se z ní' },
            { value: 'kombinace', label: 'Kombinace zaměstnání a podnikání' },
            { value: 'jine', label: 'Jinak (rodičovská, student, bez příjmu…)' },
          ],
          required: true,
          informs: ['denni_odskodne', 'invalidita', 'obecne'],
        },
        {
          key: 'prijem_cisty',
          type: 'currency',
          label: 'Kolik vám měsíčně čistého přijde na účet?',
          help: 'U podnikání berte to, co si reálně z podnikání „vyplácíte“ pro sebe, ne obrat.',
          placeholder: 'např. 45 000',
          min: 0,
          step: 1000,
          unit: 'Kč / měsíc',
          required: true,
          informs: ['denni_odskodne', 'invalidita', 'smrt', 'zavazna_onemocneni'],
        },
        {
          key: 'prijem_variabilni',
          type: 'single',
          label: 'Jak velkou část příjmu tvoří odměny, provize nebo bonusy?',
          options: [
            { value: 'zadnou', label: 'Skoro žádnou, mám pevný plat' },
            { value: 'do_tretiny', label: 'Do třetiny' },
            { value: 'vetsinu', label: 'Většinu – když nepracuji, nevydělávám' },
          ],
          required: true,
          informs: ['denni_odskodne'],
        },
        {
          key: 'osvc_nemocenska',
          type: 'single',
          label: 'Platíte si jako OSVČ dobrovolné nemocenské pojištění?',
          help: 'Bez něj vám stát při nemoci neplatí vůbec nic. Většina OSVČ ho nemá.',
          options: [
            { value: 'ano', label: 'Ano' },
            { value: 'ne', label: 'Ne' },
            { value: 'nevim', label: 'Nevím' },
          ],
          showIf: [{ key: 'typ_prace', op: 'in', value: ['osvc', 'kombinace'] }],
          required: true,
          informs: ['denni_odskodne'],
        },
        {
          key: 'osvc_nemocenska_zaklad',
          type: 'currency',
          label: 'Z jakého měsíčního základu si nemocenské platíte?',
          help: 'Najdete na přehledu pro ČSSZ. Pokud nevíte, nechte prázdné.',
          unit: 'Kč / měsíc',
          showIf: [{ key: 'osvc_nemocenska', op: 'eq', value: 'ano' }],
          informs: ['denni_odskodne'],
        },
        {
          key: 'zamestnavatel_benefity',
          type: 'multi',
          label: 'Co vám zaměstnavatel při nemoci dává navíc?',
          options: [
            { value: 'sick_days', label: 'Sick days (placené dny nemoci)' },
            { value: 'doplatek', label: 'Doplatek nemocenské do plné mzdy' },
            { value: 'zivotni_pojisteni', label: 'Příspěvek na životní pojištění' },
            { value: 'nic', label: 'Nic z toho / nevím' },
          ],
          showIf: [{ key: 'typ_prace', op: 'in', value: ['zamestnanec', 'kombinace'] }],
          informs: ['denni_odskodne'],
        },
        {
          key: 'naplan_prace',
          type: 'single',
          label: 'Co nejlépe vystihuje vaši práci?',
          help: 'Určuje, jaké zranění by vás vyřadilo z práce – a jak pojišťovna hodnotí riziko.',
          options: [
            { value: 'kancelar', label: 'Převážně u počítače / v kanceláři' },
            { value: 'pohyb', label: 'Hodně na nohou, ale bez fyzické námahy (obchod, školství, zdravotnictví)' },
            { value: 'manualni', label: 'Fyzická práce, řemeslo, výroba' },
            { value: 'rizikova', label: 'Riziková (výšky, těžké stroje, hasiči, policie…)' },
            { value: 'ridic', label: 'Profesionální řidič / hodně za volantem' },
          ],
          required: true,
          informs: ['obecne', 'trvale_nasledky', 'invalidita', 'denni_odskodne'],
        },
        {
          key: 'roky_prace',
          type: 'single',
          label: 'Kolik let celkem pracujete nebo podnikáte?',
          help: 'Nárok na invalidní důchod od státu závisí na odpracovaných letech.',
          options: [
            { value: 'do_5', label: 'Méně než 5 let' },
            { value: '5_15', label: '5–15 let' },
            { value: 'nad_15', label: 'Více než 15 let' },
          ],
          required: true,
          informs: ['invalidita'],
        },
        {
          key: 'osvc_odvody',
          type: 'single',
          label: 'Platíte na sociálním pojištění spíš minimum, nebo víc?',
          help: 'Kdo platí minimum, má od státu při invaliditě jen několik tisíc měsíčně.',
          options: [
            { value: 'minimum', label: 'Minimum / paušální daň' },
            { value: 'vic', label: 'Více než minimum' },
            { value: 'nevim', label: 'Nevím' },
          ],
          showIf: [{ key: 'typ_prace', op: 'in', value: ['osvc', 'jednatel', 'kombinace'] }],
          informs: ['invalidita'],
        },
      ],
    },

    // ------------------------------------------------------------------
    {
      key: 'vydaje',
      title: 'Výdaje a závazky',
      intro: 'Kolik musí domácnost zaplatit každý měsíc, ať se děje cokoli.',
      questions: [
        {
          key: 'vydaje_nutne',
          type: 'currency',
          label: 'Kolik měsíčně musí vaše domácnost nutně zaplatit?',
          help: 'Bydlení, energie, jídlo, děti, auto, splátky, pojistky. Bez dovolených a zábavy.',
          placeholder: 'např. 35 000',
          step: 1000,
          unit: 'Kč / měsíc',
          required: true,
          informs: ['denni_odskodne', 'invalidita', 'smrt'],
        },
        {
          key: 'hypoteka',
          type: 'yesno',
          label: 'Splácíte hypotéku?',
          required: true,
          informs: ['smrt', 'invalidita'],
        },
        {
          key: 'hypoteka_zustatek',
          type: 'currency',
          label: 'Kolik zbývá doplatit?',
          step: 100000,
          unit: 'Kč',
          showIf: [{ key: 'hypoteka', op: 'eq', value: true }],
          required: true,
          informs: ['smrt', 'invalidita'],
        },
        {
          key: 'hypoteka_splatka',
          type: 'currency',
          label: 'Měsíční splátka',
          step: 500,
          unit: 'Kč / měsíc',
          showIf: [{ key: 'hypoteka', op: 'eq', value: true }],
          informs: ['denni_odskodne', 'invalidita'],
        },
        {
          key: 'hypoteka_roky',
          type: 'number',
          label: 'Kolik let ještě budete splácet?',
          min: 1,
          max: 40,
          unit: 'let',
          showIf: [{ key: 'hypoteka', op: 'eq', value: true }],
          informs: ['smrt'],
        },
        {
          key: 'hypoteka_spoludluznik',
          type: 'single',
          label: 'Kdo hypotéku splácí?',
          options: [
            { value: 'ja', label: 'Jen já' },
            { value: 'spolecne', label: 'Já i partner/ka' },
          ],
          showIf: [{ key: 'hypoteka', op: 'eq', value: true }],
          informs: ['smrt'],
        },
        {
          key: 'jine_uvery',
          type: 'currency',
          label: 'Ostatní úvěry a půjčky – kolik zbývá doplatit celkem?',
          help: 'Auto, spotřebitelské úvěry, kreditky. Pokud nic, nechte 0.',
          step: 10000,
          unit: 'Kč',
          informs: ['smrt', 'invalidita'],
        },
        {
          key: 'rezerva',
          type: 'single',
          label: 'Jak dlouho byste vydrželi z úspor, kdyby vám přestal chodit příjem?',
          help: 'Podle toho nastavíme, od kterého dne nemoci má pojistka platit. Delší rezerva = levnější pojistka.',
          options: [
            { value: 'do_1m', label: 'Méně než měsíc' },
            { value: '1_3m', label: '1–3 měsíce' },
            { value: '3_6m', label: '3–6 měsíců' },
            { value: 'nad_6m', label: 'Více než 6 měsíců' },
          ],
          required: true,
          informs: ['denni_odskodne', 'hospitalizace'],
        },
        {
          key: 'majetek',
          type: 'single',
          label: 'Máte majetek nebo investice, které by se v nouzi daly prodat?',
          options: [
            { value: 'ne', label: 'Ne / jen bydlení, ve kterém žijeme' },
            { value: 'do_500', label: 'Ano, do 500 000 Kč' },
            { value: '500_2000', label: 'Ano, 500 000 – 2 mil. Kč' },
            { value: 'nad_2000', label: 'Ano, přes 2 mil. Kč' },
          ],
          informs: ['invalidita', 'smrt'],
        },
      ],
    },

    // ------------------------------------------------------------------
    {
      key: 'zdravi',
      title: 'Zdraví a životní styl',
      intro: 'Odpovědi ovlivní, jaká rizika jsou pro vás nejdůležitější a co vám pojišťovna nabídne.',
      questions: [
        {
          key: 'vyska',
          type: 'number',
          label: 'Výška',
          min: 120,
          max: 230,
          unit: 'cm',
          informs: ['obecne'],
        },
        {
          key: 'vaha',
          type: 'number',
          label: 'Váha',
          min: 35,
          max: 250,
          unit: 'kg',
          informs: ['obecne'],
        },
        {
          key: 'koureni',
          type: 'single',
          label: 'Kouříte?',
          options: [
            { value: 'ne', label: 'Ne, nikdy' },
            { value: 'byvaly', label: 'Přestal/a jsem před více než rokem' },
            { value: 'ano', label: 'Ano (včetně e-cigaret a nikotinových sáčků)' },
          ],
          required: true,
          informs: ['obecne', 'zavazna_onemocneni'],
        },
        {
          key: 'lecba',
          type: 'multi',
          label: 'Léčíte se s něčím, nebo berete pravidelně léky?',
          help: 'Nepotřebujeme detaily, jen orientaci. Vše je důvěrné.',
          options: [
            { value: 'nic', label: 'Ne, jsem zdravý/á' },
            { value: 'tlak_srdce', label: 'Vysoký tlak, srdce, cholesterol' },
            { value: 'cukrovka', label: 'Cukrovka' },
            { value: 'zada_klouby', label: 'Záda, klouby, páteř' },
            { value: 'psychika', label: 'Psychika (úzkosti, deprese, vyhoření)' },
            { value: 'stitna', label: 'Štítná žláza, hormony' },
            { value: 'onkologie', label: 'Onkologické onemocnění (i vyléčené)' },
            { value: 'jine', label: 'Něco jiného' },
          ],
          required: true,
          informs: ['obecne', 'zavazna_onemocneni', 'invalidita'],
        },
        {
          key: 'lecba_jine_text',
          type: 'text',
          label: 'Můžete stručně napsat, s čím se léčíte?',
          placeholder: 'nepovinné',
          showIf: [{ key: 'lecba', op: 'includes', value: 'jine' }],
          informs: ['obecne'],
        },
        {
          key: 'urazy_operace',
          type: 'yesno',
          label: 'Měl/a jste v posledních 5 letech vážnější úraz, operaci nebo hospitalizaci?',
          required: true,
          informs: ['obecne', 'trvale_nasledky'],
        },
        {
          key: 'rodinna_anamneza',
          type: 'multi',
          label: 'Objevilo se u rodičů nebo sourozenců některé z těchto onemocnění před 60. rokem?',
          help: 'Dědičná zátěž rozhoduje, jak moc posílit pojištění závažných nemocí.',
          options: [
            { value: 'ne', label: 'Ne / nevím o tom' },
            { value: 'rakovina', label: 'Rakovina' },
            { value: 'infarkt_mrtvice', label: 'Infarkt nebo mrtvice' },
            { value: 'cukrovka', label: 'Cukrovka' },
            { value: 'neurologie', label: 'Roztroušená skleróza, Parkinson, Alzheimer' },
          ],
          required: true,
          informs: ['zavazna_onemocneni', 'invalidita'],
        },
        {
          key: 'sporty',
          type: 'multi',
          label: 'Jaké sporty děláte pravidelně?',
          help: 'Některé sporty pojišťovny vylučují nebo zdražují. Lepší vědět předem.',
          options: [
            { value: 'zadne', label: 'Žádné / jen procházky' },
            { value: 'bezne', label: 'Běh, kolo, plavání, fitness, míčové hry' },
            { value: 'zimni', label: 'Lyže, snowboard' },
            { value: 'bojove', label: 'Bojové sporty' },
            { value: 'moto', label: 'Motorka, motokáry, závody' },
            { value: 'horske', label: 'Horolezectví, ferraty, skialpinismus' },
            { value: 'letecke_vodni', label: 'Paragliding, potápění, rafting, kite' },
            { value: 'kone_jine', label: 'Jezdectví nebo jiný rizikový sport' },
          ],
          required: true,
          informs: ['obecne', 'trvale_nasledky', 'denni_odskodne'],
        },
        {
          key: 'sporty_uroven',
          type: 'single',
          label: 'Na jaké úrovni sportujete?',
          options: [
            { value: 'rekreacne', label: 'Rekreačně' },
            { value: 'registrovane', label: 'Registrovaně / závodně (amatér)' },
            { value: 'profi', label: 'Profesionálně nebo za peníze' },
          ],
          showIf: [{ key: 'sporty', op: 'neq', value: ['zadne'] }],
          informs: ['obecne'],
        },
        {
          key: 'auto_km',
          type: 'single',
          label: 'Kolik kilometrů ročně najedete autem?',
          options: [
            { value: 'do_10', label: 'Do 10 000 km' },
            { value: '10_30', label: '10 000 – 30 000 km' },
            { value: 'nad_30', label: 'Více než 30 000 km' },
          ],
          informs: ['trvale_nasledky', 'smrt'],
        },
      ],
    },

    // ------------------------------------------------------------------
    {
      key: 'stavajici',
      title: 'Co už máte',
      questions: [
        {
          key: 'ma_zp',
          type: 'single',
          label: 'Máte už nějaké životní nebo úrazové pojištění?',
          options: [
            { value: 'ano', label: 'Ano' },
            { value: 'ne', label: 'Ne' },
            { value: 'nevim', label: 'Nevím / mám něco z dětství' },
          ],
          required: true,
          informs: ['obecne'],
        },
        {
          key: 'zp_platba',
          type: 'currency',
          label: 'Kolik za něj platíte měsíčně?',
          step: 100,
          unit: 'Kč / měsíc',
          showIf: [{ key: 'ma_zp', op: 'eq', value: 'ano' }],
          informs: ['obecne'],
        },
        {
          key: 'zp_spokojenost',
          type: 'single',
          label: 'Víte, co přesně máte pojištěné?',
          options: [
            { value: 'ano', label: 'Ano, vím přesně' },
            { value: 'castecne', label: 'Zhruba' },
            { value: 'ne', label: 'Ne, podepsal/a jsem to a nevím' },
          ],
          showIf: [{ key: 'ma_zp', op: 'eq', value: 'ano' }],
          informs: ['obecne'],
        },
        {
          key: 'zp_smlouva',
          type: 'upload',
          label: 'Nahrajte stávající smlouvu (nepovinné)',
          help: 'Stačí fotka nebo PDF. Poradce zkontroluje, co v ní opravdu je, a jestli ji zrušit, upravit nebo nechat.',
          showIf: [{ key: 'ma_zp', op: 'in', value: ['ano', 'nevim'] }],
          informs: ['obecne'],
        },
      ],
    },

    // ------------------------------------------------------------------
    {
      key: 'priority',
      title: 'Co je pro vás důležité',
      questions: [
        {
          key: 'obavy',
          type: 'rank',
          label: 'Seřaďte, čeho se v souvislosti s příjmem bojíte nejvíc',
          help: 'Přetáhněte odshora dolů. Pomůže nám to rozhodnout, kam dát v pojistce největší váhu.',
          options: [
            { value: 'kratkodoby', label: 'Být pár měsíců bez příjmu (nemoc, zlomenina)' },
            { value: 'dlouhodoby', label: 'Nikdy už nemoct pracovat (invalidita)' },
            { value: 'nemoc', label: 'Vážná nemoc a náklady na léčbu' },
            { value: 'smrt', label: 'Že rodina zůstane bez mého příjmu natrvalo' },
          ],
          required: true,
          informs: ['denni_odskodne', 'invalidita', 'zavazna_onemocneni', 'smrt'],
        },
        {
          key: 'rozpocet',
          type: 'single',
          label: 'Kolik jste ochotni měsíčně dávat za jistotu, že příjem nevypadne?',
          help: 'Orientačně. Doporučení ukážeme ve dvou variantách – „musí být“ a „ideál“.',
          options: [
            { value: 'do_1000', label: 'Do 1 000 Kč' },
            { value: '1000_2000', label: '1 000 – 2 000 Kč' },
            { value: '2000_3500', label: '2 000 – 3 500 Kč' },
            { value: 'nad_3500', label: 'Více než 3 500 Kč' },
            { value: 'nevim', label: 'Nevím, poraďte' },
          ],
          required: true,
          informs: ['obecne'],
        },
        {
          key: 'koho_pojistit',
          type: 'multi',
          label: 'Koho chcete řešit?',
          options: [
            { value: 'ja', label: 'Jen sebe' },
            { value: 'partner', label: 'I partnera/ku' },
            { value: 'deti', label: 'I děti' },
          ],
          required: true,
          informs: ['obecne'],
        },
        {
          key: 'poznamka',
          type: 'text',
          label: 'Chcete poradci ještě něco říct?',
          placeholder: 'nepovinné – např. „za rok chci na hypotéku“ nebo „mám zamítnutou pojistku“',
          informs: ['obecne'],
        },
      ],
    },
  ],
};

// ======================================================================
// Výpočet doporučení – kostra logiky pro poradce (ne pro klienta).
// Konstanty jsou orientační a určené k doladění, ne pojistně-matematické.
// ======================================================================

export const ASSUMPTIONS = {
  /** kolik % čistého příjmu zhruba nahradí státní nemocenská u zaměstnance
   *  (po redukci základu; u vyšších příjmů reálně méně) */
  nemocenskaZamestnanecRatio: 0.55,
  /** OSVČ bez dobrovolného nemocenského = 0 */
  nemocenskaOsvcBezPojisteniRatio: 0,
  /** orientační státní invalidní důchod (Kč/měsíc) pro průměrný příjem a plnou dobu pojištění */
  invalidniDuchod: { id1: 6500, id2: 8500, id3: 14000 },
  /** OSVČ s minimálními odvody – snížený odhad */
  invalidniDuchodMinimum: { id1: 5000, id2: 6000, id3: 9500 },
  /** důchodový věk pro horizont invalidity */
  duchodovyVek: 65,
  /** kolik let výpadku příjmu má pokrýt pojištění závažných onemocnění */
  zavaznaOnemocneniRoky: 2,
  /** minimální částka na léčbu / nadstandard při závažném onemocnění */
  zavaznaOnemocneniMinimum: 500_000,
  /** kolik ročních příjmů nad rámec dluhů má krýt pojištění smrti pro rodinu s dětmi */
  smrtRocnichPrijmu: 3,
  /** pohřeb a náklady spojené s úmrtím */
  smrtFixni: 100_000,
};

export type Answers = Record<string, string | number | boolean | string[] | null | undefined>;

export interface Recommendation {
  denniOdskodne: { castkaDenne: number; odKarencnihoDne: number; kryjeNemoc: boolean };
  hospitalizace: { castkaDenne: number };
  invalidita: {
    id1: number;
    id2: number;
    id3: number;
    typ: 'klesajici' | 'konstantni';
    poznamka: string;
  };
  zavaznaOnemocneni: { castka: number };
  smrt: { klesajici: number; konstantni: number };
  trvaleNasledky: { castka: number; progresivni: true; odProcent: number };
  flags: string[];
}

const num = (v: unknown, fallback = 0) => (typeof v === 'number' && !Number.isNaN(v) ? v : fallback);
const has = (v: unknown, x: string) => Array.isArray(v) && v.includes(x);

export function computeRecommendation(a: Answers): Recommendation {
  const A = ASSUMPTIONS;
  const flags: string[] = [];

  const prijem = num(a.prijem_cisty);
  const vydaje = num(a.vydaje_nutne, prijem * 0.7);
  const vek = num(a.vek, 35);
  const letDoDuchodu = Math.max(A.duchodovyVek - vek, 5);
  const jeOsvc = ['osvc', 'jednatel', 'kombinace'].includes(String(a.typ_prace));

  // --- Denní odškodné (pracovní neschopnost) ---
  let statniRatio = A.nemocenskaZamestnanecRatio;
  if (jeOsvc && a.osvc_nemocenska !== 'ano') {
    statniRatio = A.nemocenskaOsvcBezPojisteniRatio;
    flags.push('OSVČ bez nemocenského – při nemoci má od státu 0 Kč, PN je prioritou.');
  }
  if (a.prijem_variabilni === 'vetsinu') {
    statniRatio *= 0.6; // nemocenská se počítá z vyměřovacího základu, ne z reálného příjmu
    flags.push('Většina příjmu je variabilní – státní nemocenská bude výrazně nižší než odhad.');
  }
  const vypadekMesicne = Math.max(vydaje - prijem * statniRatio, 0);
  const karence: Record<string, number> = { do_1m: 15, '1_3m': 29, '3_6m': 57, nad_6m: 85 };
  const odKarencnihoDne = jeOsvc && a.osvc_nemocenska !== 'ano'
    ? Math.min(karence[String(a.rezerva)] ?? 29, 29)
    : karence[String(a.rezerva)] ?? 29;

  // --- Invalidita ---
  const duchod = a.osvc_odvody === 'minimum' ? A.invalidniDuchodMinimum : A.invalidniDuchod;
  if (a.roky_prace === 'do_5') {
    flags.push('Méně než 5 let práce – nárok na státní invalidní důchod může být nulový.');
  }
  const dluhy = num(a.hypoteka_zustatek) + num(a.jine_uvery);
  const rocniVypadek = (id: number) => Math.max((vydaje - id) * 12, 0);
  const id3 = Math.round((rocniVypadek(duchod.id3) * letDoDuchodu + dluhy) / 100_000) * 100_000;
  const id2 = Math.round(id3 * 0.7 / 100_000) * 100_000;
  const id1 = Math.round(id3 * 0.4 / 100_000) * 100_000;

  // --- Závažná onemocnění ---
  const zavazna = Math.max(prijem * 12 * A.zavaznaOnemocneniRoky, A.zavaznaOnemocneniMinimum);
  if (has(a.rodinna_anamneza, 'rakovina') || has(a.rodinna_anamneza, 'infarkt_mrtvice')) {
    flags.push('Rodinná anamnéza – posílit závažná onemocnění, zkontrolovat čekací doby a definice diagnóz.');
  }

  // --- Smrt ---
  const maZavisle = num(a.deti_pocet) > 0 || a.partner_prijem === 'ne';
  const letProRodinu = num(a.deti_pocet) > 0 ? Math.max(24 - num(a.deti_nejmladsi_vek), 5) : 0;
  const smrtKlesajici = a.hypoteka_spoludluznik === 'spolecne' ? Math.round(num(a.hypoteka_zustatek) / 2) : num(a.hypoteka_zustatek);
  const smrtKonstantni = maZavisle
    ? Math.round((Math.min(prijem * 12 * A.smrtRocnichPrijmu, vydaje * 12 * letProRodinu) + num(a.jine_uvery) + A.smrtFixni) / 100_000) * 100_000
    : A.smrtFixni + num(a.jine_uvery);

  // --- Trvalé následky úrazu ---
  const rizikovaPrace = ['manualni', 'rizikova', 'ridic'].includes(String(a.naplan_prace));
  const rizikovySport = ['moto', 'horske', 'letecke_vodni', 'bojove', 'kone_jine'].some(s => has(a.sporty, s));
  const trvale = (rizikovaPrace || rizikovySport ? 1.5 : 1) * Math.max(prijem * 12 * 2, 1_000_000);
  if (rizikovySport) flags.push('Rizikový sport – ověřit výluky/přirážky u vybrané pojišťovny.');
  if (a.sporty_uroven === 'profi') flags.push('Profesionální sport – většina pojišťoven nepojistí bez individuálního ocenění.');

  // --- Zdravotní flagy pro poradce ---
  if (has(a.lecba, 'onkologie')) flags.push('Onkologie v anamnéze – očekávat výluku/odklad u ZO, řešit individuálně.');
  if (has(a.lecba, 'psychika')) flags.push('Psychika – u některých pojišťoven výluka pro PN/invaliditu z psychických příčin.');
  if (has(a.lecba, 'zada_klouby')) flags.push('Páteř/klouby – časté výluky u PN a invalidity, vybrat pojišťovnu podle podmínek.');
  const vyska = num(a.vyska), vaha = num(a.vaha);
  if (vyska && vaha && vaha / ((vyska / 100) ** 2) > 35) flags.push('BMI > 35 – možná přirážka nebo odmítnutí.');
  if (a.ma_zp === 'ano' && a.zp_spokojenost !== 'ano') flags.push('Stávající smlouva – vyžádat a zkontrolovat před návrhem.');

  return {
    denniOdskodne: {
      castkaDenne: Math.ceil(vypadekMesicne / 30 / 50) * 50,
      odKarencnihoDne,
      kryjeNemoc: true,
    },
    hospitalizace: { castkaDenne: prijem > 60_000 ? 1000 : 500 },
    invalidita: {
      id1, id2, id3,
      typ: dluhy > 0 && num(a.deti_pocet) === 0 ? 'klesajici' : 'konstantni',
      poznamka: 'Krýt nemoc i úraz. Preferovat definici podle ČSSZ, ověřit plnění za 1. stupeň.',
    },
    zavaznaOnemocneni: { castka: Math.round(zavazna / 100_000) * 100_000 },
    smrt: { klesajici: smrtKlesajici, konstantni: smrtKonstantni },
    trvaleNasledky: { castka: Math.round(trvale / 100_000) * 100_000, progresivni: true, odProcent: 0.5 },
    flags,
  };
}
