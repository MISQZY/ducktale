import * as React from "react"
import { cn } from "@/lib/utils"


function DuckCard({
  className,
  size = "default",
  ...props
}: React.ComponentProps<"div"> & { size?: "default" | "sm" }) {
  return (
    <div
      data-slot="card"
      data-size={size}
      className={cn(
        "group/card relative flex flex-col gap-4 overflow-hidden rounded-xl text-sm",
        "bg-stone-900/60 border border-gold-800/20",
        "shadow-[0_0_0_1px_rgba(212,160,23,0.04),inset_0_1px_0_rgba(212,160,23,0.06)]",
        "data-[size=sm]:gap-3",
        className
      )}
      {...props}
    >
      <span
        className="pointer-events-none absolute top-0 left-0 block w-3 h-3 border-t-2 border-l-2 border-gold-500/30 rounded-tl-xl"
        aria-hidden="true"
      />
      <span
        className="pointer-events-none absolute bottom-0 right-0 block w-3 h-3 border-b-2 border-r-2 border-gold-500/30 rounded-br-xl"
        aria-hidden="true"
      />
      {props.children}
    </div>
  )
}

function DuckCardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "grid auto-rows-min items-start gap-1 px-5 pt-5",
        "has-data-[slot=card-action]:grid-cols-[1fr_auto]",
        "has-data-[slot=card-description]:grid-rows-[auto_auto]",
        "group-data-[size=sm]/card:px-4 group-data-[size=sm]/card:pt-4",
        "[.border-b]:pb-4",
        className
      )}
      {...props}
    />
  )
}

function DuckCardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "text-base font-semibold leading-snug text-amber-100/90 tracking-wide",
        "group-data-[size=sm]/card:text-sm",
        className
      )}
      style={{ fontFamily: "var(--font-display)" }}
      {...props}
    />
  )
}

function DuckCardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-amber-100/45 leading-relaxed", className)}
      {...props}
    />
  )
}

function DuckCardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn("col-start-2 row-span-2 row-start-1 self-start justify-self-end", className)}
      {...props}
    />
  )
}

function DuckCardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-5 group-data-[size=sm]/card:px-4 py-4", className)}
      {...props}
    />
  )
}

function DuckCardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center rounded-b-xl border-t border-gold-800/20 bg-stone-900/40 px-5 py-4",
        "group-data-[size=sm]/card:px-4 group-data-[size=sm]/card:py-3",
        className
      )}
      {...props}
    />
  )
}

export {
  DuckCard,
  DuckCardHeader,
  DuckCardFooter,
  DuckCardTitle,
  DuckCardAction,
  DuckCardDescription,
  DuckCardContent,
}