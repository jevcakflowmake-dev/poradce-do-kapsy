/**
 * Souhlas s cookies.
 *
 * Lišta se ukazuje jen tehdy, když je opravdu co povolovat — tedy když je
 * nastavené ID měření. Dokud web žádný měřicí skript nenačítá, používá jen
 * cookie přihlášení, a ta je technicky nezbytná; ptát se na ni by bylo
 * matoucí a zákon to nevyžaduje (§ 89 odst. 3 zákona č. 127/2005 Sb.).
 *
 * Jakmile Jakub doplní `NEXT_PUBLIC_GA4_ID` nebo `NEXT_PUBLIC_META_PIXEL_ID`,
 * lišta naběhne sama a skripty se smí načíst teprve po kliknutí na souhlas.
 * Pro ukázku bez měření je tu `NEXT_PUBLIC_COOKIE_LISTA=1`.
 */

export const SOUHLAS_KLIC = 'pdk-souhlas-cookies'

/** Verze znění. Když se změní, co se měří, zvedni ji a lišta se zeptá znovu. */
export const SOUHLAS_VERZE = 1

export type Volba = 'vse' | 'jen-nutne'

export type UlozenySouhlas = {
  volba: Volba
  verze: number
  kdy: string
}

export const MERENI = {
  ga4: process.env.NEXT_PUBLIC_GA4_ID ?? '',
  metaPixel: process.env.NEXT_PUBLIC_META_PIXEL_ID ?? '',
} as const

/** Má se uživatele vůbec na co ptát? */
export const MERENI_AKTIVNI =
  Boolean(MERENI.ga4 || MERENI.metaPixel) || process.env.NEXT_PUBLIC_COOKIE_LISTA === '1'

/** Událost, na kterou si počká budoucí loader měřicích skriptů. */
export const SOUHLAS_UDALOST = 'pdk:souhlas'

export function prectiSouhlas(): UlozenySouhlas | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(SOUHLAS_KLIC)
    if (!raw) return null
    const data = JSON.parse(raw) as UlozenySouhlas
    // Starší verze znění neplatí – ptáme se znovu.
    return data.verze === SOUHLAS_VERZE ? data : null
  } catch {
    // Soukromé okno nebo zakázané úložiště: chováme se, jako by souhlas nebyl.
    return null
  }
}

export function ulozSouhlas(volba: Volba): void {
  const data: UlozenySouhlas = { volba, verze: SOUHLAS_VERZE, kdy: new Date().toISOString() }
  try {
    window.localStorage.setItem(SOUHLAS_KLIC, JSON.stringify(data))
  } catch {
    // Bez úložiště souhlas nepřežije načtení stránky; skripty se tím pádem
    // nenačtou ani příště, což je bezpečnější strana chyby.
  }
  window.dispatchEvent(new CustomEvent(SOUHLAS_UDALOST, { detail: data }))
}

export function zrusSouhlas(): void {
  try {
    window.localStorage.removeItem(SOUHLAS_KLIC)
  } catch {
    // viz výše
  }
  window.dispatchEvent(new CustomEvent(SOUHLAS_UDALOST, { detail: null }))
}

/** Smí se načíst měřicí skript? Používej vždycky tohle, ne localStorage přímo. */
export function souhlasSMerenim(): boolean {
  return prectiSouhlas()?.volba === 'vse'
}
