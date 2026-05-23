"use client"

import * as React from "react"
import { HoverCard as HoverCardPrimitive } from "radix-ui"
import { cn } from "@/lib/utils"


function DuckHoverCard({
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Root>) {
  return <HoverCardPrimitive.Root data-slot="hover-card" {...props} />
}

function DuckHoverCardTrigger({
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Trigger>) {
  return <HoverCardPrimitive.Trigger data-slot="hover-card-trigger" {...props} />
}

function DuckHoverCardContent({
  className,
  align = "center",
  sideOffset = 6,
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Content>) {
  return (
    <HoverCardPrimitive.Portal data-slot="hover-card-portal">
      <HoverCardPrimitive.Content
        data-slot="hover-card-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-50 w-64 rounded-xl p-4 text-sm",
          "bg-stone-950 border border-gold-800/30",
          "shadow-[0_0_40px_rgba(0,0,0,0.7),0_0_12px_rgba(212,160,23,0.06)]",
          "text-amber-100/80",
          "origin-(--radix-hover-card-content-transform-origin)",
          "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
          "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
          "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          "duration-150",
          className
        )}
        {...props}
      />
    </HoverCardPrimitive.Portal>
  )
}

export { DuckHoverCard, DuckHoverCardTrigger, DuckHoverCardContent }