import { MERENI, souhlasSMerenim } from '@/lib/souhlas'

/**
 * Měření návštěvnosti přes Google Analytics 4.
 *
 * Co tenhle soubor hlídá na jednom místě:
 *
 * 1. Bez souhlasu se nenačte nic. Skript gtag.js se vkládá až tomu, kdo
 *    v liště zvolil „Přijmout vše“.
 * 2. Klientská zóna a portál poradce se neměří nikdy, ani se souhlasem.
 *    Jsou tam finanční a zdravotní údaje a v adresách ID klientů. Stránka
 *    načtená rovnou tam GA vůbec nedostane.
 * 3. Do GA nejde nic osobního, jen názvy událostí. Adresa s přihlašovacím
 *    kódem nebo e-mailem v parametrech se neměří.
 *
 * Zobrazení stránek posílá GA samo, i při přechodech bez načtení stránky
 * (hlídá si historii prohlížeče). Proto platí jednoduché pravidlo: jakmile se
 * v načtené stránce objeví neměřená adresa, měření se vypne a zůstane vypnuté
 * až do dalšího načtení. GA tak nikdy nevidí soukromou adresu – ani jako
 * stránku, ani jako „odkud člověk přišel“ u té další.
 */

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

const ID = MERENI.ga4

type Adresa = Pick<URL, 'pathname' | 'search' | 'hash'>

/** Kde se neměří nikdy. Cesta platí i pro všechno pod ní. */
const NEMERENE_CESTY = ['/dashboard', '/advisor', '/auth', '/api', '/update-password', '/reset-password'] as const

/** Parametry adresy, které do měření nesmí: přihlašovací kódy a vše, co může nést osobní údaj. */
const CITLIVY_PARAMETR = /^(code|token|token_hash|access_token|refresh_token|error_description|e-?mail|q|next|redirect_to)$/i

export function smiSeMerit(adresa: Adresa): boolean {
  const { pathname } = adresa
  if (NEMERENE_CESTY.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return false
  for (const [klic, hodnota] of new URLSearchParams(adresa.search)) {
    if (CITLIVY_PARAMETR.test(klic) || hodnota.includes('@')) return false
  }
  // Kotva sekce ano, tokeny za mřížkou (#access_token=…) ne.
  return /^(#[\w-]*)?$/.test(adresa.hash)
}

/** V tomhle načtení stránky už se gtag.js vložil. */
let spusteno = false
/** Od spuštění se objevila neměřená adresa – do dalšího načtení se neposílá nic. */
let vyrazeno = false
/** Souhlas byl v tomhle načtení odvolán a GA o tom ví. */
let odvolano = false
/** Atribut na <html> jsme přidali my (a ne třeba doplněk prohlížeče pro odhlášení z GA). */
let nasAtribut = false

const ATRIBUT_ZAKAZU = 'data-google-analytics-opt-out'

/**
 * gtag.js před zpracováním každé události čte `window['ga-disable-<ID>']`
 * a atribut na <html>; když najde jedno z toho, událost zahodí. Atribut je
 * druhá pojistka, která nezávisí na ID.
 */
function nastavZakaz(): void {
  const zakazano = vyrazeno || !souhlasSMerenim()
  const okno = window as unknown as Record<string, unknown>
  okno[`ga-disable-${ID}`] = zakazano

  const html = document.documentElement
  if (zakazano && !html.hasAttribute(ATRIBUT_ZAKAZU)) {
    html.setAttribute(ATRIBUT_ZAKAZU, '')
    nasAtribut = true
  } else if (!zakazano && nasAtribut) {
    html.removeAttribute(ATRIBUT_ZAKAZU)
    nasAtribut = false
  }
}

function naZmenuAdresy(adresa: Adresa): void {
  if (!smiSeMerit(adresa)) vyrazeno = true
  nastavZakaz()
}

/**
 * Zákaz se musí přepnout dřív, než si změny adresy všimne GA. To si obaluje
 * `history.pushState`; když ho obalíme my jako první (před načtením gtag.js),
 * běží náš kód uvnitř a tedy před jeho měřením. Kdyby obal někdo sundal,
 * přepočítá se zákaz ještě z komponenty `Mereni` při každé změně stránky.
 */
function hlidejNavigaci(): void {
  for (const metoda of ['pushState', 'replaceState'] as const) {
    const puvodni = window.history[metoda]
    window.history[metoda] = function (this: History, stav: unknown, nepouzite: string, adresa?: string | URL | null) {
      if (adresa != null) {
        try {
          naZmenuAdresy(new URL(String(adresa), window.location.href))
        } catch {
          // Nečitelná adresa: raději neměřit.
          vyrazeno = true
          nastavZakaz()
        }
      }
      return puvodni.call(this, stav, nepouzite, adresa)
    }
  }
  const zOkna = () => naZmenuAdresy(window.location)
  window.addEventListener('popstate', zOkna, { capture: true })
  window.addEventListener('hashchange', zOkna, { capture: true })
}

/**
 * Odkud člověk přišel. Po odhlášení z klientské zóny nebo z portálu by
 * prohlížeč nabídl adresu s ID klienta – místo ní jde do měření jen úvod webu.
 */
function cistyReferrer(): string {
  const odkud = document.referrer
  if (!odkud) return ''
  try {
    const adresa = new URL(odkud)
    if (adresa.origin !== window.location.origin) return odkud
    return smiSeMerit(adresa) ? odkud : `${adresa.origin}/`
  } catch {
    return `${window.location.origin}/`
  }
}

/**
 * Zapne měření, pokud k němu člověk dal souhlas. Dá se volat opakovaně:
 * poprvé vloží gtag.js, potom už jen přepočítá, jestli se aktuální adresa
 * smí měřit.
 */
export function zapniMereni(): void {
  if (typeof window === 'undefined' || !ID || !souhlasSMerenim()) return

  if (spusteno) {
    naZmenuAdresy(window.location)
    if (odvolano) {
      // Souhlas vrácený po odvolání ve stejném okně.
      window.gtag?.('consent', 'update', { analytics_storage: 'granted' })
      odvolano = false
    }
    return
  }

  // Stránka načtená v neměřené části webu GA vůbec nedostane.
  if (!smiSeMerit(window.location)) return
  spusteno = true
  nastavZakaz()
  hlidejNavigaci()

  const fronta = (window.dataLayer = window.dataLayer ?? [])
  // GA čte z fronty objekt `arguments`, obyčejné pole by ignorovalo.
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params -- viz výše, gtag potřebuje právě `arguments`
    fronta.push(arguments)
  }
  // Jen měření návštěvnosti. Reklamní úložiště ani personalizace se nezapínají nikdy.
  window.gtag('consent', 'default', {
    analytics_storage: 'granted',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  })
  window.gtag('js', new Date())
  const odkud = cistyReferrer()
  window.gtag('config', ID, {
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    ...(odkud ? { page_referrer: odkud } : {}),
  })

  const skript = document.createElement('script')
  skript.async = true
  skript.src = `https://www.googletagmanager.com/gtag/js?id=${ID}`
  document.head.appendChild(skript)
}

/** Odvolaný nebo nedaný souhlas: nic neposílat a cookies měření smazat. */
export function vypniMereni(): void {
  if (typeof window === 'undefined' || !ID) return
  if (spusteno) {
    nastavZakaz()
    if (!odvolano) {
      window.gtag?.('consent', 'update', { analytics_storage: 'denied' })
      odvolano = true
    }
  }
  smazCookiesMereni()
}

/** Smaže cookies `_ga` a `_ga_<ID>` – GA je ukládá na doménu i s tečkou na začátku. */
function smazCookiesMereni(): void {
  const jmena = document.cookie
    .split(';')
    .map((c) => c.trim().split('=')[0])
    .filter((jmeno) => jmeno === '_ga' || jmeno.startsWith('_ga_'))
  if (jmena.length === 0) return

  const host = window.location.hostname
  const casti = host.split('.')
  const domeny = new Set(['', host, `.${host}`])
  if (casti.length > 2) domeny.add(`.${casti.slice(-2).join('.')}`)

  for (const jmeno of jmena) {
    for (const domena of domeny) {
      document.cookie = `${jmeno}=; Max-Age=0; path=/${domena ? `; domain=${domena}` : ''}`
    }
  }
}

/**
 * Pošle událost do GA – jen se souhlasem a jen z měřené části webu. Vrací,
 * jestli se opravdu odeslala.
 *
 * Název: malá písmena, číslice a podtržítka, nejvýš 40 znaků. Důležité věci
 * patří do názvu, ne do parametrů: názvy se v přehledech GA ukážou samy,
 * parametry až po ručním nastavení. Nic osobního (e-mail, jméno, ID klienta,
 * částky) sem nepatří vůbec.
 */
export function zmer(udalost: string, parametry: Record<string, string | number | boolean> = {}): boolean {
  if (typeof window === 'undefined' || !ID) return false
  if (process.env.NODE_ENV !== 'production' && !/^[a-z][a-z0-9_]{0,39}$/.test(udalost)) {
    console.warn(`Měření: název události „${udalost}“ GA nepřijme.`)
  }
  // Komponenta `Mereni` leží v layoutu až za obsahem, takže její efekt běží
  // později než efekty stránky. Kdo měří jako první, ten GA spustí.
  zapniMereni()
  if (!spusteno || vyrazeno || !souhlasSMerenim() || !window.gtag) return false
  window.gtag('event', udalost, parametry)
  return true
}
