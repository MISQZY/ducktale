import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"
import { cn } from "@/lib/utils"


const duckBadgeVariants = cva(
  [
    "inline-flex items-center justify-center gap-1 shrink-0 whitespace-nowrap",
    "text-xs font-medium tracking-wide transition-all",
    "focus-visible:ring-2 focus-visible:ring-gold-500/50",
    "[&>svg]:pointer-events-none [&>svg]:size-3!",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "h-5 px-2 rounded-full bg-gold-500/15 text-gold-300 border border-gold-500/30",
        secondary:
          "h-5 px-2 rounded-full bg-stone-700/60 text-amber-100/70 border border-stone-600/40",
        destructive:
          "h-5 px-2 rounded-full bg-red-900/25 text-red-400 border border-red-800/40",
        outline:
          "h-5 px-2 rounded-full border border-gold-700/35 text-amber-100/60 bg-transparent",
        ghost:
          "h-5 px-2 rounded-full text-amber-100/50 hover:bg-stone-700/40",
        link: "text-gold-400 underline-offset-3 hover:underline px-0",
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