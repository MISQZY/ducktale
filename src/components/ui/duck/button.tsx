import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"
import { cn } from "@/lib/utils"

const duckButtonVariants = cva(
  [
    "group/button inline-flex shrink-0 items-center justify-center gap-1.5",
    "font-medium whitespace-nowrap transition-all duration-200 outline-none select-none",
    "disabled:pointer-events-none disabled:opacity-40",
    "focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-1 focus-visible:ring-offset-stone-950",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "bg-primary text-neutral-950 border border-primary/60",
          "hover:bg-primary hover:border-primary/80",
          "shadow-[0_0_12px_rgba(212,160,23,0.25)] hover:shadow-[0_0_20px_rgba(212,160,23,0.4)]",
          "active:translate-y-px",
        ].join(" "),
        outline: [
          "border border-primary/40 bg-transparent text-primary/80",
          "hover:border-primary/60 hover:bg-primary/6 hover:text-primary",
          "active:translate-y-px",
        ].join(" "),
        secondary: [
          "border border-border/60 bg-muted/70 text-foreground/70",
          "hover:bg-muted/70 hover:text-foreground/90 hover:border-border/70",
          "active:translate-y-px",
        ].join(" "),
        ghost: [
          "bg-transparent text-foreground/60 border border-transparent",
          "hover:bg-primary/6 hover:text-primary/90 hover:border-primary/20",
        ].join(" "),
        destructive: [
          "bg-destructive/15 text-destructive border border-destructive/40",
          "hover:bg-destructive/25 hover:text-destructive hover:border-destructive/60",
        ].join(" "),
        link: "text-primary underline-offset-4 hover:underline hover:text-primary border border-transparent",
      },
      size: {
        default: "h-9 rounded-lg px-4 text-sm",
        xs: "h-6 rounded-md px-2 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 rounded-md px-3 text-[0.8rem] [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 rounded-xl px-6 text-base",
        icon: "size-9 rounded-lg",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-7 rounded-md",
        "icon-lg": "size-11 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function DuckButton({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof duckButtonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"
  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(duckButtonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { DuckButton, duckButtonVariants }