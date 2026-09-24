import type { CSSProperties, ReactNode } from 'react'
import { partnerPodleNazvu, type Partner } from '@/lib/partneri'
import { cn } from '@/lib/utils'

/**
 * Loga partnerů jsou jen tvar (alfa kanál, viz scripts/partneri-loga.mts);
 * barvu dává pozadí prvku přes masku, takže sedí k paletě a mění se tokenem.
 */
const maska = (url: string): CSSProperties => ({
  WebkitMask: `url(${url}) center / contain no-repeat`,
  mask: `url(${url}) center / contain no-repeat`,
})

/**
 * Samotná značka partnera v navy. Velikost podle plochy, ne podle šířky:
 * široký nápis i čtvercový znak dostanou plochu čtverce o straně `--k`
 * (nastavuje rodič), nejvýš však šířku rodiče.
 *
 * `popisek` jen tam, kde vedle loga název společnosti chybí (hlavní
 * stránka); u varianty nebo smlouvy by čtečka četla název dvakrát.
 */
export function ZnakPartnera({ partner, popisek = false }: { partner: Partner; popisek?: boolean }) {
  return (
    <span
      {...(popisek ? { role: 'img', 'aria-label': partner.nazev } : { 'aria-hidden': true })}
      // V režimu vysokého kontrastu by systém navy přebarvil na pozadí a logo
      // zmizelo – proto tam barva textu systému.
      className="block w-[min(100%,calc(var(--s)*var(--k)))] bg-navy forced-color-adjust-none forced-colors:bg-[CanvasText]"
      style={
        {
          ...maska(partner.logo),
          aspectRatio: `${partner.sirka} / ${partner.vyska}`,
          '--s': Math.sqrt(partner.sirka / partner.vyska).toFixed(3),
        } as CSSProperties
      }
    />
  )
}

/**
 * Dlaždice se značkou společnosti u variant plánu a u smluv. Partnera pozná
 * podle názvu, jak ho napsal poradce – u smlouvy se zkouší víc míst
 * (společnost, starší pole, název smlouvy), proto i pole názvů; vyhraje
 * první, který partnera najde. Jinak ukáže `nahrada` – zkratku z plánu nebo
 * ikonu druhu smlouvy. Dlaždice má pevnou velikost, aby v seznamu začínaly
 * názvy pod sebou, ať logo je, nebo není.
 *
 * Je dekorace: název společnosti stojí vedle ní v textu.
 */
export default function LogoFirmy({
  firma,
  nahrada,
  className = '',
}: {
  firma: string | null | undefined | ReadonlyArray<string | null | undefined>
  nahrada?: ReactNode
  className?: string
}) {
  const nazvy = typeof firma === 'string' || !firma ? [firma] : firma
  const partner = nazvy.map(partnerPodleNazvu).find(Boolean) ?? null
  return (
    <span
      aria-hidden
      // cn (twMerge): „hidden sm:flex“ od volajícího přebije výchozí flex.
      className={cn('flex w-20 h-12 shrink-0 items-center justify-center rounded-input bg-cream px-1.5 [--k:2rem]', className)}
    >
      {partner ? (
        <ZnakPartnera partner={partner} />
      ) : (
        <span className="font-display font-semibold text-navy text-base leading-none">
          {nahrada ?? nazvy[0]?.trim().charAt(0).toUpperCase()}
        </span>
      )}
    </span>
  )
}
