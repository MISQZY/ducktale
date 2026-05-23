import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"
import { cn } from "@/lib/utils"

const duckButtonVariants = cva(
  [
    "group/button inline-flex shrink-0 items-center justify-center gap-1.5",
    "font-medium whitespace-nowrap transition-all duration-200 outline-none select-none",
    "disabled:pointer-events-none disabled:opacity-40",
    "focus-visible:ring-2 focus-visible:ring-gold-500/50 focus-visible:ring-offset-1 focus-visible:ring-offset-stone-950",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "bg-gold-500 text-stone-950 border border-gold-400/60",
          "hover:bg-gold-400 hover:border-gold-300/80",
          "shadow-[0_0_12px_rgba(212,160,23,0.25)] hover:shadow-[0_0_20px_rgba(212,160,23,0.4)]",
          "active:translate-y-px",
        ].join(" "),
        outline: [
          "border border-gold-700/40 bg-transparent text-gold-300/80",
          "hover:border-gold-500/60 hover:bg-gold-500/6 hover:text-gold-200",
          "active:translate-y-px",
        ].join(" "),
        secondary: [
          "border border-stone-700/60 bg-stone-800/70 text-amber-100/70",
          "hover:bg-stone-700/70 hover:text-amber-100/90 hover:border-stone-600/70",
          "active:translate-y-px",
        ].join(" "),
        ghost: [
          "bg-transparent text-amber-100/60 border border-transparent",
          "hover:bg-gold-400/6 hover:text-gold-300/90 hover:border-gold-700/20",
        ].join(" "),
        destructive: [
          "bg-red-900/30 text-red-400 border border-red-800/40",
          "hover:bg-red-900/50 hover:text-red-300 hover:border-red-700/60",
        ].join(" "),
        link: "text-gold-400 underline-offset-4 hover:underline hover:text-gold-300 border border-transparent",
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