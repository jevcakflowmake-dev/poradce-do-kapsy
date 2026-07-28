import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-none text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#009EE2]/20 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-[#162459] text-[#F6F4EE] hover:bg-[#0e1a3d] hover:-translate-y-0.5",
        navy:
          "bg-[#162459] text-[#F6F4EE] hover:bg-[#0e1a3d] hover:-translate-y-0.5",
        accent:
          "bg-[#009EE2] text-[#0B111F] hover:bg-[#1a9fdd] hover:-translate-y-0.5",
        outline:
          "border border-[#E4DFD2] bg-[#FDFCF8] text-[#162459] hover:border-[#009EE2] hover:text-[#0079AD]",
        ghost: "text-[#162459] hover:bg-[#EFEBE0]",
        destructive:
          "bg-[#ea580c] text-white hover:bg-[#c2410c]",
        link:
          "text-[#0079AD] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-7 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
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
