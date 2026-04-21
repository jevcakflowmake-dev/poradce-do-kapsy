import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#009EE2]/20 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "text-white shadow-sm hover:shadow-lg hover:shadow-[#009EE2]/25 bg-[linear-gradient(135deg,#009EE2,#0088c6)] hover:-translate-y-0.5",
        navy:
          "bg-[#162459] text-white hover:bg-[#0e1a3d] hover:-translate-y-0.5",
        outline:
          "border border-[#E8E9EE] bg-white text-[#162459] hover:border-[#009EE2] hover:text-[#0088c6]",
        ghost: "text-[#162459] hover:bg-[#f8f9fc]",
        destructive:
          "bg-[#ea580c] text-white hover:bg-[#c2410c]",
        link:
          "text-[#0088c6] underline-offset-4 hover:underline",
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
