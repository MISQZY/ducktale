"use client"

import * as React from "react"
import { Dialog as SheetPrimitive } from "radix-ui"
import { XIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { DuckButton } from "./button"

function DuckSheet({ ...props }: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

function DuckSheetTrigger({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function DuckSheetClose({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

function DuckSheetPortal({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Portal>) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function DuckSheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/55 duration-150",
        "supports-backdrop-filter:backdrop-blur-xs",
        "data-open:animate-in data-open:fade-in-0",
        "data-closed:animate-out data-closed:fade-out-0",
        className
      )}
      {...props}
    />
  )
}

function DuckSheetContent({
  className,
  children,
  side = "right",
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: "top" | "right" | "bottom" | "left"
  showCloseButton?: boolean
}) {
  return (
    <DuckSheetPortal>
      <DuckSheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        data-side={side}
        className={cn(
          "fixed z-50 flex flex-col gap-4 text-sm",
          "bg-stone-950/97 backdrop-blur-md",
          "transition duration-200 ease-in-out outline-none",
          "data-[side=right]:border-l data-[side=left]:border-r data-[side=top]:border-b data-[side=bottom]:border-t",
          "border-gold-800/25",
          "shadow-[0_0_60px_rgba(0,0,0,0.8)]",
          "data-[side=right]:inset-y-0 data-[side=right]:right-0 data-[side=right]:h-full data-[side=right]:w-3/4 data-[side=right]:sm:max-w-sm",
          "data-[side=left]:inset-y-0 data-[side=left]:left-0 data-[side=left]:h-full data-[side=left]:w-3/4 data-[side=left]:sm:max-w-sm",
          "data-[side=top]:inset-x-0 data-[side=top]:top-0 data-[side=top]:h-auto",
          "data-[side=bottom]:inset-x-0 data-[side=bottom]:bottom-0 data-[side=bottom]:h-auto",
          "data-open:animate-in data-open:fade-in-0",
          "data-[side=right]:data-open:slide-in-from-right-10",
          "data-[side=left]:data-open:slide-in-from-left-10",
          "data-[side=top]:data-open:slide-in-from-top-10",
          "data-[side=bottom]:data-open:slide-in-from-bottom-10",
          "data-closed:animate-out data-closed:fade-out-0",
          "data-[side=right]:data-closed:slide-out-to-right-10",
          "data-[side=left]:data-closed:slide-out-to-left-10",
          "data-[side=top]:data-closed:slide-out-to-top-10",
          "data-[side=bottom]:data-closed:slide-out-to-bottom-10",
          className
        )}
        {...props}
      >
        <div className="h-px bg-linear-to-r from-transparent via-gold-600/30 to-transparent shrink-0" />
        {children}
        {showCloseButton && (
          <SheetPrimitive.Close data-slot="sheet-close" asChild>
            <DuckButton
              variant="ghost"
              size="icon-sm"
              className="absolute top-3 right-3"
            >
              <XIcon />
              <span className="sr-only">Закрыть</span>
            </DuckButton>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Content>
    </DuckSheetPortal>
  )
}

function DuckSheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-0.5 px-5 py-4", className)}
      {...props}
    />
  )
}

function DuckSheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn(
        "mt-auto flex flex-col gap-2 px-5 py-4",
        "border-t border-gold-800/20 bg-stone-900/40",
        className
      )}
      {...props}
    />
  )
}

function DuckSheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn(
        "text-base font-semibold text-amber-100/90 tracking-wide",
        className
      )}
      style={{ fontFamily: "var(--font-display)" }}
      {...props}
    />
  )
}

function DuckSheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-sm text-amber-100/45 leading-relaxed", className)}
      {...props}
    />
  )
}

export {
  DuckSheet,
  DuckSheetTrigger,
  DuckSheetClose,
  DuckSheetContent,
  DuckSheetHeader,
  DuckSheetFooter,
  DuckSheetTitle,
  DuckSheetDescription,
}
