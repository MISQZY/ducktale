"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { resetUserPassword, unlinkUser, deleteUser, setUserAdmin } from "@/lib/actions/admin";
import { FormButton } from "@/components/common/FormButton";
import CopyToClipboard from "@/components/ui/CopyToClipboard";

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
  const [isPending, startTransition] = useTransition();
  const [newPassword, setNewPassword] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleResetPassword() {
    if (!window.confirm(t("confirmReset", { nickname }))) return;
    setError(null);
    startTransition(async () => {
      try {
        const password = await resetUserPassword(lang, userId);
        setNewPassword(password);
      } catch {
        setError(t("actionFailed"));
      }
    });
  }

  function handleUnlink() {
    if (!window.confirm(t("confirmUnlink", { nickname }))) return;
    setError(null);
    startTransition(async () => {
      try {
        await unlinkUser(lang, userId);
      } catch {
        setError(t("actionFailed"));
      }
    });
  }

  function handleDelete() {
    if (!window.confirm(t("confirmDelete", { nickname }))) return;
    setError(null);
    startTransition(async () => {
      try {
        await deleteUser(lang, userId);
      } catch {
        setError(t("actionFailed"));
      }
    });
  }

  function handleToggleAdmin() {
    const confirmText = isAdmin
      ? t("confirmRevokeAdmin", { nickname })
      : t("confirmGrantAdmin", { nickname });
    if (!window.confirm(confirmText)) return;
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
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <FormButton
          variant="outline"
          className="px-4 py-1.5 text-xs"
          disabled={isPending}
          onClick={handleResetPassword}
        >
          {t("resetPassword")}
        </FormButton>

        {hasLink && (
          <FormButton
            variant="outline"
            className="px-4 py-1.5 text-xs"
            disabled={isPending}
            onClick={handleUnlink}
          >
            {t("unlink")}
          </FormButton>
        )}

        {!isSelf && (
          <FormButton
            variant="outline"
            className="px-4 py-1.5 text-xs"
            disabled={isPending}
            onClick={handleToggleAdmin}
          >
            {isAdmin ? t("revokeAdmin") : t("grantAdmin")}
          </FormButton>
        )}

        {!isSelf && (
          <FormButton
            variant="destructive"
            className="px-4 py-1.5 text-xs"
            disabled={isPending}
            onClick={handleDelete}
          >
            {t("delete")}
          </FormButton>
        )}
      </div>

      {newPassword && (
        <div className="text-xs text-foreground/60">
          <p className="mb-1">{t("newPasswordHint")}</p>
          <CopyToClipboard value={newPassword}>
            <div className="flex items-center gap-2 rounded-lg bg-muted border border-primary/20 px-3 py-2 cursor-pointer w-fit">
              <span className="font-mono text-sm text-foreground tracking-wide">{newPassword}</span>
            </div>
          </CopyToClipboard>
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
