/**
 * Banky, pojišťovny a investiční společnosti v sekci „Se kým spolupracuji“.
 * Abecedně, ať pořadí nic nenaznačuje.
 *
 * Loga připravuje `scripts/partneri-loga.mts` (jednobarevný tvar na
 * průhledném podkladu). `sirka` a `vyska` jsou rozměry souboru – slouží
 * k poměru stran, zobrazenou velikost počítá sekce sama.
 */
export interface Partner {
  nazev: string
  logo: string
  sirka: number
  vyska: number
}

export const PARTNERI: Partner[] = [
  { nazev: 'Allianz', logo: '/partneri/allianz.webp', sirka: 271, vyska: 68 },
  { nazev: 'Amundi', logo: '/partneri/amundi.webp', sirka: 238, vyska: 91 },
  { nazev: 'AXA', logo: '/partneri/axa.webp', sirka: 225, vyska: 225 },
  { nazev: 'Conseq', logo: '/partneri/conseq.webp', sirka: 236, vyska: 117 },
  { nazev: 'Česká spořitelna', logo: '/partneri/ceska-sporitelna.webp', sirka: 244, vyska: 101 },
  { nazev: 'ČPP', logo: '/partneri/cpp.webp', sirka: 192, vyska: 101 },
  { nazev: 'ČSOB', logo: '/partneri/csob.webp', sirka: 104, vyska: 81 },
  { nazev: 'Flexi životní pojištění', logo: '/partneri/flexi.webp', sirka: 241, vyska: 205 },
  { nazev: 'Generali', logo: '/partneri/generali.webp', sirka: 113, vyska: 92 },
  { nazev: 'Hypoteční banka', logo: '/partneri/hypotecni-banka.webp', sirka: 343, vyska: 79 },
  { nazev: 'Komerční banka', logo: '/partneri/komercni-banka.webp', sirka: 361, vyska: 130 },
  { nazev: 'Kooperativa', logo: '/partneri/kooperativa.webp', sirka: 224, vyska: 160 },
  { nazev: 'mBank', logo: '/partneri/mbank.webp', sirka: 480, vyska: 110 },
  { nazev: 'MetLife', logo: '/partneri/metlife.webp', sirka: 261, vyska: 57 },
  { nazev: 'Modrá pyramida', logo: '/partneri/modra-pyramida.webp', sirka: 480, vyska: 104 },
  { nazev: 'NN', logo: '/partneri/nn.webp', sirka: 200, vyska: 106 },
  { nazev: 'Raiffeisenbank', logo: '/partneri/raiffeisenbank.webp', sirka: 279, vyska: 76 },
  { nazev: 'UNIQA', logo: '/partneri/uniqa.webp', sirka: 192, vyska: 151 },
]
