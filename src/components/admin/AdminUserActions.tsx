"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Trash2, KeyRound, Unlink, Shield, ShieldOff } from "lucide-react";
import { resetUserPassword, unlinkUser, deleteUser, setUserAdmin } from "@/lib/actions/admin";
import { buttonVariants } from "@/components/ui/button";
import CopyToClipboard from "@/components/ui/CopyToClipboard";
import { cn } from "@/lib/utils";
import { useConfirm } from "@/components/common/ConfirmDialogProvider";

interface AdminUserActionsProps {
  lang: string;
  userId: string;
  nickname: string;
  isSelf: boolean;
  hasLink: boolean;
  isAdmin: boolean;
}

export function AdminUserActions({ lang, userId, nickname, isSelf, hasLink, isAdmin }: AdminUserActionsProps) {
  const t = useTranslations("Admin");
  const confirm = useConfirm();
  const [isPending, startTransition] = useTransition();
  const [resetLink, setResetLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleResetPassword() {
    if (!(await confirm({ description: t("confirmReset", { nickname }) }))) return;
    setError(null);
    startTransition(async () => {
      try {
        const link = await resetUserPassword(lang, userId);
        setResetLink(link);
      } catch {
        setError(t("actionFailed"));
      }
    });
  }

  async function handleUnlink() {
    if (!(await confirm({ description: t("confirmUnlink", { nickname }) }))) return;
    setError(null);
    startTransition(async () => {
      try {
        await unlinkUser(lang, userId);
      } catch {
        setError(t("actionFailed"));
      }
    });
  }

  async function handleDelete() {
    if (!(await confirm({ description: t("confirmDelete", { nickname }), variant: "destructive" }))) return;
    setError(null);
    startTransition(async () => {
      try {
        await deleteUser(lang, userId);
      } catch {
        setError(t("actionFailed"));
      }
    });
  }

  async function handleToggleAdmin() {
    const confirmText = isAdmin
      ? t("confirmRevokeAdmin", { nickname })
      : t("confirmGrantAdmin", { nickname });
    if (!(await confirm({ description: confirmText, variant: isAdmin ? "destructive" : "default" }))) return;
    setError(null);
    startTransition(async () => {
      try {
        await setUserAdmin(lang, userId, !isAdmin);
      } catch {
        setError(t("actionFailed"));
      }
    });
  }



  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap items-center justify-end gap-1.5">
        <button
          type="button"
          aria-label={t("resetPassword")}
          title={t("resetPassword")}
          disabled={isPending}
          onClick={handleResetPassword}
          className={cn(
            buttonVariants({ variant: "outline", size: "icon-sm" }),
            "bg-card/70 hover:text-primary hover:border-primary/40"
          )}
        >
          <KeyRound size={14} />
        </button>

        {hasLink && (
          <button
            type="button"
            aria-label={t("unlink")}
            title={t("unlink")}
            disabled={isPending}
            onClick={handleUnlink}
            className={cn(
              buttonVariants({ variant: "outline", size: "icon-sm" }),
              "bg-card/70 hover:text-primary hover:border-primary/40"
            )}
          >
            <Unlink size={14} />
          </button>
        )}

        {!isSelf && (
          <button
            type="button"
            aria-label={isAdmin ? t("revokeAdmin") : t("grantAdmin")}
            title={isAdmin ? t("revokeAdmin") : t("grantAdmin")}
            disabled={isPending}
            onClick={handleToggleAdmin}
            className={cn(
              buttonVariants({ variant: "outline", size: "icon-sm" }),
              "bg-card/70 hover:text-primary hover:border-primary/40"
            )}
          >
            {isAdmin ? <ShieldOff size={14} /> : <Shield size={14} />}
          </button>
        )}

        {!isSelf && (
          <button
            type="button"
            disabled={isPending}
            onClick={handleDelete}
            aria-label={t("delete")}
            title={t("delete")}
            className={cn(
              buttonVariants({ variant: "outline", size: "icon-sm" }),
              "bg-card/70 hover:text-destructive hover:border-destructive/40"
            )}
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {resetLink && (
        <div className="text-xs text-foreground/60">
          <p className="mb-1">{t("newPasswordHint")}</p>
          <CopyToClipboard value={resetLink}>
            <div
              className="flex items-center gap-2 rounded-lg bg-muted border border-primary/20 px-3 py-2 cursor-pointer max-w-full"
              title={resetLink}
            >
              <span className="font-mono text-sm text-foreground tracking-wide truncate">
                {resetLink}
              </span>
            </div>
          </CopyToClipboard>
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
