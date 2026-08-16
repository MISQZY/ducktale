"use client";

import { type ReactNode } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { FormButton } from "@/components/common/FormButton";
import { cn } from "@/lib/utils";

interface AdminFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactNode;
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
      <DialogTrigger asChild>{trigger}</DialogTrigger>
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
