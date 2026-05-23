"use client"

import * as React from "react"
import { Collapsible as CollapsiblePrimitive } from "radix-ui"
import { cn } from "@/lib/utils"

function DuckCollapsible({
  className,
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.Root>) {
  return (
    <CollapsiblePrimitive.Root
      data-slot="collapsible"
      className={cn(className)}
      {...props}
    />
  )
}

function DuckCollapsibleTrigger({
  className,
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleTrigger>) {
  return (
    <CollapsiblePrimitive.CollapsibleTrigger
      data-slot="collapsible-trigger"
      className={cn(
        "flex items-center gap-1.5 text-xs text-amber-100/45",
        "hover:text-amber-100/70 transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/50 rounded-sm",
        "[&_svg]:transition-transform [&_svg]:duration-200",
        "data-[state=open]:[&_svg.collapsible-chevron]:rotate-90",
        className
      )}
      {...props}
    />
  )
}

function DuckCollapsibleContent({
  className,
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleContent>) {
  return (
    <CollapsiblePrimitive.CollapsibleContent
      data-slot="collapsible-content"
      className={cn(
        "overflow-hidden",
        "data-[state=open]:animate-in data-[state=open]:fade-in-0",
        "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
        className
      )}
      {...props}
    />
  )
}

export { DuckCollapsible, DuckCollapsibleTrigger, DuckCollapsibleContent }
