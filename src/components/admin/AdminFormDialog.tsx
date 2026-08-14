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

          <DialogFooter>
            <FormButton type="submit" disabled={submitting} className="w-full sm:w-auto">
              {submitting ? submittingLabel : submitLabel}
            </FormButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
