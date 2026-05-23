import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const duckAlertVariants = cva(
  [
    "group/alert relative grid w-full gap-0.5 rounded-lg border px-4 py-3 text-left text-sm",
    "has-data-[slot=alert-action]:pr-16 has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-3",
    "*:[svg]:row-span-2 *:[svg]:translate-y-0.5 *:[svg]:text-current *:[svg:not([class*='size-'])]:size-4",
    "shadow-[inset_0_1px_0_rgba(212,160,23,0.04)]",
  ].join(" "),
  {
    variants: {
      variant: {
        default: "bg-stone-900/70 border-gold-800/25 text-amber-100/80",
        destructive:
          "bg-red-950/40 border-red-800/35 text-red-300 *:data-[slot=alert-description]:text-red-300/70 *:[svg]:text-red-400",
        warning:
          "bg-amber-950/40 border-amber-700/35 text-amber-200 *:data-[slot=alert-description]:text-amber-200/70 *:[svg]:text-amber-400",
        success:
          "bg-emerald-950/40 border-emerald-800/35 text-emerald-300 *:data-[slot=alert-description]:text-emerald-300/70 *:[svg]:text-emerald-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function DuckAlert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof duckAlertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(duckAlertVariants({ variant }), className, 'not-prose')}
      {...props}
    />
  )
}

function DuckAlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "font-semibold tracking-wide text-amber-100/90 group-has-[>svg]/alert:col-start-2",
        className
      )}
      style={{ fontFamily: "var(--font-display)" }}
      {...props}
    />
  )
}

function DuckAlertDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "text-sm text-amber-100/50 leading-relaxed group-has-[>svg]/alert:col-start-2",
        "[&_a]:text-gold-400 [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-gold-300",
        "[&_p:not(:last-child)]:mb-3",
        className
      )}
      {...props}
    />
  )
}

function DuckAlertAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-action"
      className={cn("absolute top-2.5 right-3", className)}
      {...props}
    />
  )
}

export { DuckAlert, DuckAlertTitle, DuckAlertDescription, DuckAlertAction, duckAlertVariants }