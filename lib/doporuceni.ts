import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Kdo komu Poradce do kapsy doporučil a věrnostní body za to.
 *
 * Klient v analýze napíše jméno (sekce „Osobní údaje“, otázka `referred_by`)
 * a po uložení se páruje se jmény klientů. Páruje se jen na shodu celého
 * jména bez ohledu na diakritiku a velká písmena, a jen když to jméno má
 * jediný klient – u dvou Janů Nováků by bod mohl dostat nesprávný.
 * Nespárované doporučení přiřadí poradce ručně v detailu klienta.
 *
 * Bod = poukázka v hodnotě ODMENA_KC (Jakub 14. 10. 2026). Ukáže se hned
 * po analýze jako „čeká na smlouvu“, k proplacení je, až doporučený uzavře
 * smlouvu, a poradce ho po poslání poukázky označí jako vyplacený.
 * Tabulka `doporuceni` (migrace 021).
 */
export const OTAZKA_DOPORUCENI = 'referred_by'

/** Hodnota poukázky za jedno doporučení. Ukládá se ke každému řádku zvlášť. */
export const ODMENA_KC = 250

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

export type StavDoporuceni = 'ceka_na_smlouvu' | 'k_proplaceni' | 'vyplaceno'

export const POPIS_STAVU: Record<StavDoporuceni, string> = {
  ceka_na_smlouvu: 'Čeká na smlouvu',
  k_proplaceni: 'K proplacení',
  vyplaceno: 'Vyplaceno',
}

export interface RadekDoporuceni {
  doporuceny_id: string
  doporucitel_id: string
  odmena_kc: number
  prirazeno_rucne: boolean
  vyplaceno_at: string | null
  created_at: string
}

/** Stav se neukládá – vyplývá z výplaty a ze smluv doporučeného. */
export function stavDoporuceni(r: Pick<RadekDoporuceni, 'vyplaceno_at'>, doporucenyMaSmlouvu: boolean): StavDoporuceni {
  if (r.vyplaceno_at) return 'vyplaceno'
  return doporucenyMaSmlouvu ? 'k_proplaceni' : 'ceka_na_smlouvu'
}

/** Kteří z daných klientů mají aspoň jednu smlouvu (řádek v proposals). */
export async function klientiSeSmlouvou(db: SupabaseClient, ids: readonly string[]): Promise<Set<string>> {
  if (ids.length === 0) return new Set()
  const { data } = await db.from('proposals').select('client_id').in('client_id', [...ids])
  return new Set((data ?? []).map((r: { client_id: string }) => r.client_id))
}

/**
 * Po uložení analýzy: z napsaného jména připíše bod doporučiteli, při změně
 * jména ho přesune, při smazání odebere. Ručně přiřazené a vyplacené body
 * nechává být – o těch rozhodl poradce. Nikdy nevyhazuje chybu: analýza
 * se uložit musí, i kdyby tohle selhalo.
 *
 * @param napsane  hodnota otázky referred_by; undefined = v tomhle uložení
 *                 nebyla (průvodce ukládá i po částech), pak se nic nemění
 */
export async function syncDoporuceni(admin: SupabaseClient, klientId: string, napsane: string | undefined): Promise<void> {
  if (napsane === undefined) return
  try {
    const { data: stavajici } = await admin
      .from('doporuceni')
      .select('doporucitel_id, prirazeno_rucne, vyplaceno_at')
      .eq('doporuceny_id', klientId)
      .maybeSingle()
    if (stavajici && (stavajici.prirazeno_rucne || stavajici.vyplaceno_at)) return

    let doporucitel: string | undefined
    const jmeno = normalizujJmeno(napsane)
    if (jmeno) {
      const { data: profily } = await admin.from('profiles').select('id, full_name').neq('id', klientId)
      doporucitel = jednoznacnaJmena(profily ?? []).get(jmeno)
      if (doporucitel) {
        // Poradce má taky profil – „doporučil mi to Jakub“ mu bod nepřipíše.
        const { data: ucet } = await admin.auth.admin.getUserById(doporucitel)
        if (ucet?.user?.app_metadata?.role === 'advisor') doporucitel = undefined
      }
    }

    if (!doporucitel) {
      if (stavajici) await admin.from('doporuceni').delete().eq('doporuceny_id', klientId)
      return
    }
    if (stavajici?.doporucitel_id === doporucitel) return

    const { error } = await admin
      .from('doporuceni')
      .upsert(
        { doporuceny_id: klientId, doporucitel_id: doporucitel, odmena_kc: ODMENA_KC, prirazeno_rucne: false },
        { onConflict: 'doporuceny_id' },
      )
    if (error) console.warn('[doporuceni] připsání bodu selhalo:', error.message)
  } catch (err) {
    console.warn('[doporuceni] párování selhalo:', err instanceof Error ? err.message : err)
  }
}
