import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * Tlačítka jsou vždycky pilulka (radius 999px) a mají jediný stupeň stínu.
 * `primary` je mint s navy textem — hlavní akce na tmavém i světlém pozadí.
 * `onDark` je obrys pro tmavé sekce, `outline` obrys pro krémové pozadí.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-pill font-semibold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint/40 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-mint text-navy hover:bg-mint-dark",
        navy: "bg-navy text-cream hover:bg-navy-deep",
        outline: "border border-navy/25 text-navy hover:border-navy hover:bg-navy/5",
        onDark: "border border-cream/30 text-cream hover:border-cream hover:bg-cream/10",
        ghost: "text-navy hover:bg-navy/5",
        destructive: "bg-danger text-white hover:opacity-90",
        link: "text-navy underline underline-offset-4 hover:text-mint-dark",
      },
      size: {
        default: "h-12 px-6 text-base",
        sm: "h-10 px-5 text-base",
        lg: "h-14 px-8 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }
