import * as React from "react"
import { cn } from "@/lib/utils"

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // 48 px výška a 16 px text: menší pole se na mobilu špatně trefují
          // a iOS by při psaní zoomoval stránku.
          "flex h-12 w-full rounded-input border border-line bg-surface px-4 text-base text-navy placeholder:text-slate transition-colors",
          "focus:outline-none focus:border-mint focus:ring-4 focus:ring-mint/20",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "file:border-0 file:bg-transparent file:text-base file:font-medium file:text-navy",
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)
Input.displayName = "Input"

export { Input }
