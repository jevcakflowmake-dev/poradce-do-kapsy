/**
 * Rate limit v paměti instance pro veřejné endpointy (analýza, registrace,
 * koncept).
 *
 * Na Vercelu běží víc instancí a každá má vlastní paměť, takže tohle není
 * tvrdá hranice – je to brzda proti tomu, aby jeden skript zaplavil
 * databázi nebo poradci notifikace. Skutečnou ochranu má dělat pravidlo
 * ve Vercel Firewallu.
 */
export function vytvorLimit({ oknoMs, max }: { oknoMs: number; max: number }) {
  const zasahy = new Map<string, number[]>()

  /** Zaznamená požadavek a vrátí true, když klíč limit překročil. */
  return function prekroceno(klic: string): boolean {
    const ted = Date.now()
    const nedavne = (zasahy.get(klic) ?? []).filter((t) => ted - t < oknoMs)
    nedavne.push(ted)
    zasahy.set(klic, nedavne)

    if (zasahy.size > 5000) zasahy.clear() // pojistka proti růstu paměti
    return nedavne.length > max
  }
}

/** IP návštěvníka. Vercel hlavičku x-forwarded-for přepisuje sám, podvrhnout ji nejde. */
export function ipPozadavku(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}
