import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"
import { cn } from "@/lib/utils"


const duckBadgeVariants = cva(
  [
    "inline-flex items-center justify-center gap-1 shrink-0 whitespace-nowrap",
    "text-xs font-medium tracking-wide transition-all",
    "focus-visible:ring-2 focus-visible:ring-primary/50",
    "[&>svg]:pointer-events-none [&>svg]:size-3!",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "h-5 px-2 rounded-full bg-primary/15 text-primary border border-primary/30",
        secondary:
          "h-5 px-2 rounded-full bg-muted/60 text-foreground/70 border border-border/40",
        destructive:
          "h-5 px-2 rounded-full bg-destructive/15 text-destructive border border-destructive/40",
        outline:
          "h-5 px-2 rounded-full border border-primary/35 text-foreground/60 bg-transparent",
        ghost:
          "h-5 px-2 rounded-full text-foreground/50 hover:bg-muted/40",
        link: "text-primary underline-offset-3 hover:underline px-0",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function DuckBadge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof duckBadgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"
  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(duckBadgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { DuckBadge, duckBadgeVariants }