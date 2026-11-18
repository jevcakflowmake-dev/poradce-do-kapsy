import 'server-only'
import { absoluteUrl, SITE_URL } from '@/lib/site'

/**
 * IndexNow: oznámí vyhledávačům (Bing, Seznam a další), že se stránka
 * změnila, aby na ni nemusely čekat při dalším procházení webu. Jedno
 * oznámení na api.indexnow.org se sdílí mezi všemi zapojenými vyhledávači.
 *
 * Klíč není tajný – vyhledávač si ho ověří v souboru /<klíč>.txt
 * v public/, který musí obsahovat přesně tenhle řetězec.
 */
export const INDEXNOW_KLIC = '90588301ac40dae47b880b5bd0c3d3d7'

/** Oznámí změněné stránky. Nikdy nevyhazuje chybu, selhání jen zaloguje. */
export async function ohlasZmenu(cesty: string[]): Promise<boolean> {
  try {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: new URL(SITE_URL).host,
        key: INDEXNOW_KLIC,
        keyLocation: absoluteUrl(`/${INDEXNOW_KLIC}.txt`),
        urlList: cesty.map((c) => absoluteUrl(c)),
      }),
      signal: AbortSignal.timeout(5000),
    })
    // 200 a 202 jsou úspěch (202 = klíč se teprve ověřuje).
    if (!res.ok) console.warn(`[indexnow] HTTP ${res.status}`)
    return res.ok
  } catch (err) {
    console.warn('[indexnow] nedostupné –', err instanceof Error ? err.message : err)
    return false
  }
}
