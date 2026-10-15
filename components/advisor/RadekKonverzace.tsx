import type { Konverzace } from '@/lib/konverzace'
import { plural } from '@/lib/utils'

export const pocetNeprectenych = (n: number) =>
  `${n} ${plural(n, 'nepřečtená zpráva', 'nepřečtené zprávy', 'nepřečtených zpráv')}`

export function Odznak({ pocet }: { pocet: number }) {
  return (
    <span
      aria-hidden
      className="shrink-0 bg-danger text-white text-xs font-bold rounded-pill min-w-5 h-5 px-1.5 inline-flex items-center justify-center tabular-nums"
    >
      {pocet}
    </span>
  )
}

/**
 * Obsah jednoho řádku konverzace: kolečko s iniciálou, jméno, čas a začátek
 * poslední zprávy. Obal (odkaz v Přehledu, tlačítko ve Zprávách) dodává volající.
 */
export default function RadekKonverzace({ k, neprectene }: { k: Konverzace; neprectene: number }) {
  return (
    <>
      <span
        aria-hidden
        className="w-9 h-9 shrink-0 rounded-pill bg-navy text-cream text-sm font-bold flex items-center justify-center"
      >
        {(k.jmeno.match(/\p{L}/u)?.[0] ?? 'K').toUpperCase()}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-2">
          <span className={`truncate text-base text-navy ${neprectene > 0 ? 'font-bold' : 'font-semibold'}`}>{k.jmeno}</span>
          {k.posledni && <span className="ml-auto shrink-0 text-sm text-slate tabular-nums">{k.posledni.cas}</span>}
        </span>
        <span className="mt-0.5 flex items-center gap-2">
          <span className={`truncate text-base ${neprectene > 0 ? 'text-navy font-medium' : 'text-slate'}`}>
            {k.posledni ? (
              <>
                {k.posledni.odPoradce && 'Vy: '}
                {k.posledni.text}
              </>
            ) : (
              'Nová konverzace'
            )}
          </span>
          {neprectene > 0 && (
            <span className="ml-auto inline-flex">
              <Odznak pocet={neprectene} />
              <span className="sr-only">{pocetNeprectenych(neprectene)}</span>
            </span>
          )}
        </span>
      </span>
    </>
  )
}
