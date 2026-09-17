/**
 * Údaje o poradci, které doplní Jakub. Dokud jsou prázdné, sekce je
 * nevykreslí — radši nic než rozdělaný text na ostrém webu.
 */
export const PORADCE = {
  jmeno: 'Jakub Jevčák',

  /** TODO: fotka do /public/images/poradce.webp, na výšku, poměr 4:5, min. 900 px široká. */
  fotka: '',

  /** TODO: číslo registrace vázaného zástupce u ČNB. */
  cnbCisloRegistrace: '',

  /** Veřejný seznam regulovaných a registrovaných subjektů ČNB. */
  cnbRegistrUrl: 'https://apl.cnb.cz/apljerrsdad/JERRS.WEB07.INTRO_PAGE',

  /** TODO: přesné znění označení vázaného zástupce do patičky (dodá Jakub). */
  vazanyZastupce: '',
} as const
