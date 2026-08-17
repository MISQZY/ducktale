"use client";

import { type ReactNode } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { FormButton } from "@/components/common/FormButton";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * A `<Button>`/`<button>` element built by the caller and merged onto
 * `DialogTrigger` via Radix's `asChild` used to be the API here — but that
 * requires Radix's `Slot` to see *exactly* one valid React element, and for
 * every "create" trigger (built in a Server Component page.tsx and passed
 * down as a prop into this "use client" tree) that could transiently not
 * hold under fast client-side navigation, throwing "Primitive.button failed
 * to slot onto its children" — and forcing `asChild` off as a fallback
 * produced a *different* DOM shape (a real nested `<button>`) than the
 * `asChild`-merged one, which is exactly what a hydration mismatch is.
 * Owning the one real `<button>` here instead — icon and label are plain
 * data, always safe to render as children regardless of any of that timing,
 * with nothing left to structurally branch on.
 */
export interface AdminFormDialogTrigger {
  icon: ReactNode;
  label: string;
  /** "icon" (default — every "create" trigger) or "icon-sm" (row-action "edit" triggers, smaller to match the row height). */
  size?: "icon" | "icon-sm";
  className?: string;
}

interface AdminFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: AdminFormDialogTrigger;
  title: string;
  error: string | null;
  submitting: boolean;
  submitLabel: string;
  submittingLabel: string;
  onSubmit: (formData: FormData) => void;
  children: ReactNode;
  className?: string;
  /** Extra content rendered in the footer alongside the submit button (e.g. a "reset to default" link) — ResourceRoleLabelFormDialog is the first user of this, every other caller leaves it unset. */
  footerExtra?: ReactNode;
}

export function AdminFormDialog({
  open,
  onOpenChange,
  trigger,
  title,
  error,
  submitting,
  submitLabel,
  submittingLabel,
  onSubmit,
  children,
  className,
  footerExtra,
}: AdminFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger
        type="button"
        title={trigger.label}
        aria-label={trigger.label}
        className={cn(buttonVariants({ variant: "outline", size: trigger.size ?? "icon" }), trigger.className)}
      >
        {trigger.icon}
      </DialogTrigger>
      <DialogContent className={cn("sm:max-w-md", className)}>
        <DialogHeader>
          <DialogTitle 
            className="text-2xl text-primary/90 text-center leading-tight mb-2" 
            style={{ fontFamily: "var(--font-body)" }}
          >
            {title}
          </DialogTitle>
        </DialogHeader>

        <form action={onSubmit} className="flex flex-col gap-4">
          {children}

          {error && <p className="text-xs text-destructive">{error}</p>}

          {/* footerExtra (e.g. a "reset to default" link) always stacks under the submit button, never side-by-side — this dialog's width is fixed narrow (sm:max-w-sm) regardless of viewport, so a row layout has no room to fit a full-size CTA button next to anything else without squeezing it into an ugly wrap. */}
          <DialogFooter className={footerExtra ? "sm:flex-col-reverse sm:items-stretch sm:justify-normal" : undefined}>
            {footerExtra}
            <FormButton type="submit" disabled={submitting} className={footerExtra ? "w-full" : "w-full sm:w-auto"}>
              {submitting ? submittingLabel : submitLabel}
            </FormButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
