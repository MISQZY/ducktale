"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import type { VariantProps } from "class-variance-authority";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import type { buttonVariants } from "@/components/ui/button";

interface ConfirmOptions {
  title?: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** e.g. "destructive" for a delete/revoke confirmation. */
  variant?: VariantProps<typeof buttonVariants>["variant"];
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

interface PendingConfirm extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

const ConfirmContext = createContext<ConfirmFn | null>(null);

/**
 * App-wide replacement for window.confirm(), styled with the project's own
 * AlertDialog instead of the browser-native dialog. Mounted once (see
 * src/app/[lang]/provider.tsx); components call useConfirm() instead of
 * reaching for window.confirm directly.
 */
export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const t = useTranslations("Common");
  const [pending, setPending] = useState<PendingConfirm | null>(null);

  const confirm = useCallback<ConfirmFn>((options) => {
    return new Promise<boolean>((resolve) => {
      setPending({ ...options, resolve });
    });
  }, []);

  function settle(value: boolean) {
    pending?.resolve(value);
    setPending(null);
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AlertDialog open={pending !== null} onOpenChange={(open) => { if (!open) settle(false); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{pending?.title ?? t("confirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{pending?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => settle(false)}>
              {pending?.cancelLabel ?? t("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction variant={pending?.variant} onClick={() => settle(true)}>
              {pending?.confirmLabel ?? t("confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmContext.Provider>
  );
}

/** Returns a confirm(options) function resolving to whether the user confirmed. */
export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within a ConfirmDialogProvider");
  return ctx;
}
