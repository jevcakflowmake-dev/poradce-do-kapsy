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

  /** TODO: číslo registrace vázaného zástupce u ČNB. */
  cnbCisloRegistrace: '',

  /** Veřejný seznam regulovaných a registrovaných subjektů ČNB. */
  cnbRegistrUrl: 'https://apl.cnb.cz/apljerrsdad/JERRS.WEB07.INTRO_PAGE',

  /** TODO: přesné znění označení vázaného zástupce do patičky (dodá Jakub). */
  vazanyZastupce: '',
} as const
