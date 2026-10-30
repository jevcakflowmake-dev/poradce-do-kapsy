/**
 * Údaje o poradci. Co je prázdné, doplní Jakub — dokud tam nic není, sekce
 * se nevykreslí — radši nic než rozdělaný text na ostrém webu.
 *
 * IČO a sídlo jsou ověřené proti ARES (Jakub Jevčák, aktivní OSVČ od
 * 30. 6. 2017), ne opsané z paměti. Používají je zásady ochrany osobních
 * údajů i obchodní podmínky, proto sedí na jednom místě.
 *
 * Pozor na `email`: je na veřejných stránkách viditelný komukoliv včetně
 * sběračů adres a je to kontakt, přes který subjekt údajů uplatňuje svá
 * práva. Doména `ovbmail.cz` patří OVB, ne Jakubovi — kdyby spolupráce
 * skončila, schránka zanikne a dokumenty budou odkazovat naprázdno. Pak sem
 * patří adresa na vlastní doméně.
 */
export const PORADCE = {
  jmeno: 'Jakub Jevčák',
  ico: '06241557',
  adresa: 'Čížová 59, 398 31 Čížová',
  email: 'jakub.jevcak@ovbmail.cz',

  fotka: '/images/poradce.webp',

  /**
   * Odkdy se věnuje finančnímu poradenství. Datum je začátek podnikání podle
   * ARES; Jakub 14. 10. 2026 napsal „věnuji se 9 let“, což s ním sedí.
   * Roky v sekci Kdo jsem se z něj počítají, aby číslo samo nezestárlo.
   */
  praxeOd: '2017-06-30',

  /**
   * TODO: číslo registrace vázaného zástupce u ČNB. Web z něj vypisuje „Registrován
   * u České národní banky pod číslem…“, proto sem nepatří číslo u OVB níže, dokud
   * Jakub nepotvrdí, že jde o totéž. Registr ČNB je za CAPTCHA, ověřit to musí sám.
   */
  cnbCisloRegistrace: '',

  /** Veřejný seznam regulovaných a registrovaných subjektů ČNB. */
  cnbRegistrUrl: 'https://apl.cnb.cz/apljerrsdad/JERRS.WEB07.INTRO_PAGE',

  /**
   * Patička a přihlášení. Číslo u OVB dodal Jakub 30. 10. 2026, název a IČO OVB
   * jsou ověřené proti ARES. Znění je návrh, přesné označení může chtít OVB jiné.
   */
  vazanyZastupce: 'Vázaný zástupce společnosti OVB Allfinanz, a.s., IČO 48040410. Číslo u OVB: 4206460.',
} as const

/** Celé roky praxe k danému dni (`dnes` předává volající, viz React Compiler). */
export function rokyPraxe(dnes: Date): number {
  const od = new Date(PORADCE.praxeOd)
  const uzMelVyroci =
    dnes.getMonth() > od.getMonth() || (dnes.getMonth() === od.getMonth() && dnes.getDate() >= od.getDate())
  return dnes.getFullYear() - od.getFullYear() - (uzMelVyroci ? 0 : 1)
}

/**
 * Karta „Transparentnost“ na úvodní stránce i na stránkách oblastí. Jedno
 * místo, ať se kopie nerozejdou.
 *
 * Vychází z toho, co uvedl Jakub (9. 10. 2026): odměnu má od všech společností
 * stejnou, takže ho nic netlačí k jedné z nich. Schválně tu není slovo
 * „nezávislý“ ani „nezávisle“ – jako vázaný zástupce placený provizí je
 * v zákonném smyslu použít nesmí. Věta říká totéž fakty.
 *
 * Kdyby se odměňování změnilo (jiná provize u některé společnosti), tahle
 * věta přestane platit a musí pryč.
 */
export const TRANSPARENTNOST = {
  titul: 'Transparentnost',
  popis:
    'U každého doporučení napíšu, proč právě tahle varianta. Odměnu mám u všech společností stejnou, takže na výběr nemá vliv.',
} as const
