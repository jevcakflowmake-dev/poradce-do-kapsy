/**
 * Banky, pojišťovny a investiční společnosti, se kterými Jakub spolupracuje.
 * Loga se ukazují v sekci „S kým spolupracuji“ na hlavní stránce a u variant
 * plánu i smluv klienta. Abecedně, ať pořadí nic nenaznačuje.
 *
 * Loga připravuje `scripts/partneri-loga.mts` (jednobarevný tvar na
 * průhledném podkladu). `sirka` a `vyska` jsou rozměry souboru – slouží
 * k poměru stran, zobrazenou velikost počítá místo, kde se logo kreslí.
 *
 * `vzor` pozná partnera v názvu, jak ho poradce napsal k variantě nebo
 * smlouvě – malými písmeny a bez diakritiky, takže „Generali Česká
 * pojišťovna“ i „ČSOB Pojišťovna“ najdou své logo bez zvláštního pole
 * v databázi.
 */
export interface Partner {
  nazev: string
  logo: string
  sirka: number
  vyska: number
  vzor: RegExp
}

export const PARTNERI: Partner[] = [
  { nazev: 'Allianz', logo: '/partneri/allianz.webp', sirka: 271, vyska: 68, vzor: /\ballianz/ },
  { nazev: 'Amundi', logo: '/partneri/amundi.webp', sirka: 238, vyska: 91, vzor: /\bamundi/ },
  { nazev: 'AXA', logo: '/partneri/axa.webp', sirka: 225, vyska: 225, vzor: /\baxa\b/ },
  { nazev: 'Conseq', logo: '/partneri/conseq.webp', sirka: 236, vyska: 117, vzor: /\bconseq/ },
  {
    nazev: 'Česká spořitelna',
    logo: '/partneri/ceska-sporitelna.webp',
    sirka: 244,
    vyska: 101,
    // I „Penzijní společnost České spořitelny“ a zkratka ČS.
    vzor: /\bcesk\w* sporiteln|\bcs\b/,
  },
  { nazev: 'ČPP', logo: '/partneri/cpp.webp', sirka: 192, vyska: 101, vzor: /\bcpp\b|\bceska podnikatelska/ },
  { nazev: 'ČSOB', logo: '/partneri/csob.webp', sirka: 104, vyska: 81, vzor: /\bcsob/ },
  { nazev: 'Flexi', logo: '/partneri/flexi.webp', sirka: 241, vyska: 205, vzor: /\bflexi\b/ },
  { nazev: 'Generali', logo: '/partneri/generali.webp', sirka: 113, vyska: 92, vzor: /\bgenerali/ },
  { nazev: 'Hypoteční banka', logo: '/partneri/hypotecni-banka.webp', sirka: 343, vyska: 79, vzor: /\bhypotecni bank/ },
  { nazev: 'Komerční banka', logo: '/partneri/komercni-banka.webp', sirka: 361, vyska: 130, vzor: /\bkomercni bank|\bkb\b/ },
  { nazev: 'Kooperativa', logo: '/partneri/kooperativa.webp', sirka: 224, vyska: 160, vzor: /\bkooperativ/ },
  { nazev: 'mBank', logo: '/partneri/mbank.webp', sirka: 480, vyska: 110, vzor: /\bmbank/ },
  { nazev: 'MetLife', logo: '/partneri/metlife.webp', sirka: 261, vyska: 57, vzor: /\bmetlife/ },
  { nazev: 'Modrá pyramida', logo: '/partneri/modra-pyramida.webp', sirka: 480, vyska: 104, vzor: /\bmodr\w* pyramid/ },
  { nazev: 'NN', logo: '/partneri/nn.webp', sirka: 200, vyska: 106, vzor: /\bnn\b/ },
  { nazev: 'Raiffeisenbank', logo: '/partneri/raiffeisenbank.webp', sirka: 279, vyska: 76, vzor: /\braiffeisen/ },
  { nazev: 'UNIQA', logo: '/partneri/uniqa.webp', sirka: 192, vyska: 151, vzor: /\buniqa/ },
]

const bezDiakritiky = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')

/**
 * Partner podle názvu společnosti, nebo null. Když název zmiňuje dva
 * („Hypoteční banka ze skupiny ČSOB“), vyhraje ten, který je v něm dřív –
 * první bývá ten, o koho jde.
 */
export function partnerPodleNazvu(nazev: string | null | undefined): Partner | null {
  if (!nazev) return null
  const text = bezDiakritiky(nazev)
  let nalez: Partner | null = null
  let pozice = Infinity
  for (const partner of PARTNERI) {
    const i = text.search(partner.vzor)
    if (i !== -1 && i < pozice) {
      nalez = partner
      pozice = i
    }
  }
  return nalez
}
