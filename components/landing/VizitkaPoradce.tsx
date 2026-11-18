import Image from 'next/image'
import { PORADCE, rokyPraxe } from '@/lib/poradce'
import { plural } from '@/lib/utils'

/** Teď – mimo komponentu, React Compiler nechce `new Date()` v renderu. */
function dnes() {
  return new Date()
}

/**
 * Malá vizitka poradce: fotka, jméno a jedna věta. Web jinak působil jako
 * produkt bez člověka – tvář byla jen v sekci Kdo jsem hluboko na stránce.
 * Stojí u první výzvy na úvodu i na stránkách oblastí, v rozcestníku
 * analýzy a na děkovací stránce.
 */
export default function VizitkaPoradce({
  popis,
  naTmavem = false,
  className = '',
}: {
  /** Věta pod jménem. Bez ní se ukáže délka praxe. */
  popis?: string
  naTmavem?: boolean
  className?: string
}) {
  const roky = rokyPraxe(dnes())
  const text = popis ?? `Finanční poradce, ${roky}\u00a0${plural(roky, 'rok', 'roky', 'let')} praxe`

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {PORADCE.fotka && (
        <Image
          src={PORADCE.fotka}
          alt=""
          width={56}
          height={56}
          className={`size-14 shrink-0 rounded-pill object-cover object-top border-2 ${
            naTmavem ? 'border-cream/20' : 'border-surface'
          }`}
        />
      )}
      <p className="min-w-0 text-base leading-snug">
        <span className={`block font-semibold ${naTmavem ? 'text-cream' : 'text-navy'}`}>{PORADCE.jmeno}</span>
        <span className={`block text-pretty ${naTmavem ? 'text-cream/70' : 'text-slate'}`}>{text}</span>
      </p>
    </div>
  )
}
