import { Label } from '@/components/ui/label'

/** Třídy pro <select> a další pole bez komponenty Input – stejná výška a rámeček. */
export const poleTridy =
  'w-full h-12 rounded-input border border-line bg-surface px-4 text-base text-navy transition-colors focus:outline-none focus:border-mint focus:ring-4 focus:ring-mint/20'

/**
 * Popisek, pole a pod ním nápověda nebo chyba – u formulářů smluv. Nápověda
 * i chyba mají id `${id}-popis`, na které pole odkazuje přes aria-describedby.
 */
export function Pole({
  id,
  popisek,
  napoveda,
  chyba,
  children,
}: {
  id: string
  popisek: string
  napoveda?: string
  chyba?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <Label htmlFor={id}>{popisek}</Label>
      <div className="mt-2">{children}</div>
      {chyba ? (
        <p id={`${id}-popis`} className="mt-1.5 text-base text-danger">
          {chyba}
        </p>
      ) : (
        napoveda && (
          <p id={`${id}-popis`} className="mt-1.5 text-sm text-slate text-pretty">
            {napoveda}
          </p>
        )
      )}
    </div>
  )
}
