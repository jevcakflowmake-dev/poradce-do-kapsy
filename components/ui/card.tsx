import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Bílá plocha na krémovém pozadí: linka drží hranu, stín dodává hloubku.
 * Žádné gradienty ani průhledné vrstvy — hloubku dělá jen jeden stupeň stínu.
 */
const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("rounded-card border border-line bg-surface shadow-card", className)}
      {...props}
    />
  ),
)
Card.displayName = "Card"

/** Nadpis uvnitř karty. Velikost drží hierarchii pod nadpisem sekce. */
const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("font-display text-h3 text-navy", className)} {...props} />
  ),
)
CardTitle.displayName = "CardTitle"

export { Card, CardTitle }
