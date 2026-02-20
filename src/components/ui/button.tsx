import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-sm text-sm font-semibold transition-all active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-sm hover:brightness-110",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 shadow-sm",
        outline:
          "border border-input bg-background/50 hover:bg-accent hover:text-accent-foreground shadow-xs",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:brightness-110",
        ghost:
          "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 py-4 px-6 has-[>svg]:p-3",
        xs: "h-8 gap-1 rounded-sm py-2 px-4 text-xs has-[>svg]:p-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-10 rounded-sm gap-1.5 py-3 px-6 has-[>svg]:p-4",
        lg: "h-12 rounded-sm py-6 px-8 has-[>svg]:p-4",
        icon: "size-10",
        "icon-xs": "size-6 rounded-sm py-2 px-4 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 py-2 px-4",
        "icon-lg": "size-12 py-6 px-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
