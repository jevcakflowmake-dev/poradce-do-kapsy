/**
 * Přehled konverzací v panelu poradce – kdo psal naposled a kolik zpráv čeká.
 *
 * Skládá se na serveru a čas je už hotový text v pražském čase: prohlížeč
 * v jiném pásmu (a server ve Vercelu běží v UTC) by jinak při hydrataci
 * spočítal něco jiného, než co přišlo v HTML.
 */

export interface Konverzace {
  klientId: string
  jmeno: string
  /** null = konverzace, kterou poradce teprve začíná (zatím bez zpráv). */
  posledni: {
    /** Začátek zprávy na jeden řádek. */
    text: string
    odPoradce: boolean
    /** „14:32“, „včera“ nebo datum. */
    cas: string
  } | null
  neprectene: number
}

export interface RadekZpravy {
  client_id: string
  sender_role: 'client' | 'advisor'
  content: string
  created_at: string
}

const PRAHA = 'Europe/Prague'
const DEN = 24 * 60 * 60 * 1000
/** Delší ukázka se v řádku stejně nezobrazí, tak ji ani neposíláme do prohlížeče. */
const DELKA_UKAZKY = 160

/** Den v pražském čase jako „2026-10-12“ – na porovnání, ne na zobrazení. */
const denVPraze = (d: Date) => d.toLocaleDateString('sv-SE', { timeZone: PRAHA })

/** Dnešní zpráva časem, včerejší slovem, starší datem. */
export function casZpravy(iso: string, nyni: number): string {
  const kdy = new Date(iso)
  const den = denVPraze(kdy)
  if (den === denVPraze(new Date(nyni))) {
    return kdy.toLocaleTimeString('cs-CZ', { timeZone: PRAHA, hour: '2-digit', minute: '2-digit' })
  }
  if (den === denVPraze(new Date(nyni - DEN))) return 'včera'
  const letos = den.slice(0, 4) === denVPraze(new Date(nyni)).slice(0, 4)
  return kdy.toLocaleDateString('cs-CZ', {
    timeZone: PRAHA,
    day: 'numeric',
    month: 'numeric',
    ...(letos ? {} : { year: 'numeric' }),
  })
}

/**
 * Jedna položka na klienta, nahoře ten, s kým se psalo naposled.
 *
 * @param zpravy   zprávy od nejnovější; první výskyt klienta je jeho poslední zpráva
 * @param jmena    jen skuteční klienti – zprávy ostatních účtů se přeskočí
 */
export function sestavKonverzace(
  zpravy: readonly RadekZpravy[],
  neprectene: Readonly<Record<string, number>>,
  jmena: ReadonlyMap<string, string>,
  nyni: number,
): Konverzace[] {
  const konverzace = new Map<string, Konverzace>()
  for (const z of zpravy) {
    const jmeno = jmena.get(z.client_id)
    if (jmeno === undefined || konverzace.has(z.client_id)) continue
    konverzace.set(z.client_id, {
      klientId: z.client_id,
      jmeno,
      posledni: {
        text: z.content.replace(/\s+/g, ' ').trim().slice(0, DELKA_UKAZKY),
        odPoradce: z.sender_role === 'advisor',
        cas: casZpravy(z.created_at, nyni),
      },
      neprectene: neprectene[z.client_id] ?? 0,
    })
  }
  return [...konverzace.values()]
}
