"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "radix-ui"
import { XIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { DuckButton } from "./button"

function DuckDialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DuckDialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DuckDialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DuckDialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DuckDialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 isolate z-50 duration-150",
        "bg-black/60 supports-backdrop-filter:backdrop-blur-sm",
        "data-open:animate-in data-open:fade-in-0",
        "data-closed:animate-out data-closed:fade-out-0",
        className
      )}
      {...props}
    />
  )
}

function DuckDialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
}) {
  return (
    <DuckDialogPortal>
      <DuckDialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2",
          "gap-4 rounded-xl p-5 text-sm outline-none",
          "bg-stone-950 border border-gold-800/30",
          "shadow-[0_0_60px_rgba(0,0,0,0.8),0_0_20px_rgba(212,160,23,0.06)]",
          "sm:max-w-md",
          "duration-150",
          "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
          "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          className
        )}
        {...props}
      >
        {/* corner ornaments */}
        <span
          className="pointer-events-none absolute top-0 left-0 block w-3 h-3 border-t-2 border-l-2 border-gold-500/30 rounded-tl-xl"
          aria-hidden="true"
        />
        <span
          className="pointer-events-none absolute bottom-0 right-0 block w-3 h-3 border-b-2 border-r-2 border-gold-500/30 rounded-br-xl"
          aria-hidden="true"
        />
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close data-slot="dialog-close" asChild>
            <DuckButton
              variant="ghost"
              size="icon-sm"
              className="absolute top-2.5 right-2.5"
            >
              <XIcon />
              <span className="sr-only">Закрыть</span>
            </DuckButton>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DuckDialogPortal>
  )
}

function DuckDialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-1.5", className)}
      {...props}
    />
  )
}

function DuckDialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "-mx-5 -mb-5 flex flex-col-reverse gap-2 rounded-b-xl",
        "border-t border-gold-800/20 bg-stone-900/50 px-5 py-4",
        "sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    />
  )
}

function DuckDialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        "text-base font-semibold leading-snug text-amber-100/90 tracking-wide",
        className
      )}
      style={{ fontFamily: "var(--font-display)" }}
      {...props}
    />
  )
}

function DuckDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        "text-sm text-amber-100/50 leading-relaxed",
        "[&_a]:text-gold-400 [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-gold-300",
        className
      )}
      {...props}
    />
  )
}

export {
  DuckDialog,
  DuckDialogClose,
  DuckDialogContent,
  DuckDialogDescription,
  DuckDialogFooter,
  DuckDialogHeader,
  DuckDialogOverlay,
  DuckDialogPortal,
  DuckDialogTitle,
  DuckDialogTrigger,
}
