/**
 * Kdo komu Poradce do kapsy doporučil. Klient v analýze napíše jméno
 * (sekce „Osobní údaje“, otázka `referred_by`) a tady se páruje se jmény
 * klientů, aby poradce v detailu viděl obě strany.
 *
 * Páruje se jen na shodu celého jména bez ohledu na diakritiku a velká
 * písmena, a jen když to jméno má jediný klient – u dvou Janů Nováků by
 * odkaz mohl vést k nesprávnému. Nespárované jméno se ukáže jako text.
 *
 * Podklad pro věrnostní body za doporučení; body samotné zatím nejsou.
 */
export const OTAZKA_DOPORUCENI = 'referred_by'

export const normalizujJmeno = (jmeno: string) =>
  jmeno.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/\s+/g, ' ').trim()

export interface KlientSeJmenem {
  id: string
  full_name: string | null
}

/** Normalizované jméno → id klienta, jen pro jména, která má právě jeden klient. */
export function jednoznacnaJmena(klienti: readonly KlientSeJmenem[]): Map<string, string> {
  const podleJmena = new Map<string, string[]>()
  for (const k of klienti) {
    const jmeno = normalizujJmeno(k.full_name ?? '')
    if (jmeno) podleJmena.set(jmeno, [...(podleJmena.get(jmeno) ?? []), k.id])
  }
  return new Map([...podleJmena].filter(([, ids]) => ids.length === 1).map(([jmeno, [id]]) => [jmeno, id]))
}
