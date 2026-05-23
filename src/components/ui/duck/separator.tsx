"use client"

import * as React from "react"
import { Separator as SeparatorPrimitive } from "radix-ui"
import { cn } from "@/lib/utils"

function DuckSeparator({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root>) {
  return (
    <SeparatorPrimitive.Root
      data-slot="separator"
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0",
        "data-horizontal:h-px data-horizontal:w-full",
        "data-vertical:w-px data-vertical:self-stretch",
        orientation === "vertical"
          ? "bg-linear-to-b from-transparent via-gold-700/30 to-transparent"
          : "bg-linear-to-r from-transparent via-gold-700/30 to-transparent",
        className
      )}
      {...props}
    />
  )
}

export { DuckSeparator }