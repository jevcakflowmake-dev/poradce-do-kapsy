/**
 * Kam po přihlášení z odkazu pustit. Jen cesta v rámci webu.
 *
 * Parametr `next` přichází z adresy, tedy od kohokoliv. Dřív se lepil za
 * origin bez kontroly a `?next=@cizi.cz` z toho udělal
 * `https://poradcedokapsy.cz@cizi.cz` – prohlížeč bere část před zavináčem
 * jako jméno a odejde na cizí web, čerstvě přihlášený klient tak mohl
 * skončit na podvržené stránce.
 */
export function bezpecnyCil(next: string | null | undefined, origin: string, vychozi = '/dashboard'): URL {
  const zaloha = new URL(vychozi, origin)
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return zaloha
  const cil = new URL(next, origin)
  return cil.origin === origin ? cil : zaloha
}
