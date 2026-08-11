"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { X, Trash2 } from "lucide-react";
import { resetUserPassword, unlinkUser, deleteUser, setUserAdmin } from "@/lib/actions/admin";
import { awardBadge, revokeBadge } from "@/lib/actions/admin-badges";
import { FormButton } from "@/components/common/FormButton";
import { BadgeChip } from "@/components/badges/BadgeChip";
import { buttonVariants } from "@/components/ui/button";
import CopyToClipboard from "@/components/ui/CopyToClipboard";
import { cn } from "@/lib/utils";

interface BadgeOption {
  id: string;
  name: string;
  icon: string;
  color: string | null;
}

interface AdminUserActionsProps {
  lang: string;
  userId: string;
  nickname: string;
  isSelf: boolean;
  hasLink: boolean;
  isAdmin: boolean;
  /** Full badge catalog for the award picker — omitted entirely (no picker rendered) when there's nothing to award yet. */
  badges?: BadgeOption[];
  currentBadgeIds?: string[];
}

export function AdminUserActions({ lang, userId, nickname, isSelf, hasLink, isAdmin, badges, currentBadgeIds }: AdminUserActionsProps) {
  const t = useTranslations("Admin");
  const [isPending, startTransition] = useTransition();
  const [resetLink, setResetLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [heldIds, setHeldIds] = useState<string[]>(currentBadgeIds ?? []);
  const [pickerValue, setPickerValue] = useState("");

  function handleResetPassword() {
    if (!window.confirm(t("confirmReset", { nickname }))) return;
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

  function handleAwardBadge() {
    if (!pickerValue) return;
    const badgeId = pickerValue;
    setError(null);
    startTransition(async () => {
      try {
        await awardBadge(lang, userId, badgeId);
        setHeldIds((prev) => (prev.includes(badgeId) ? prev : [...prev, badgeId]));
        setPickerValue("");
      } catch {
        setError(t("actionFailed"));
      }
    });
  }

  function handleRevokeBadge(badgeId: string) {
    setError(null);
    startTransition(async () => {
      try {
        await revokeBadge(lang, userId, badgeId);
        setHeldIds((prev) => prev.filter((id) => id !== badgeId));
      } catch {
        setError(t("actionFailed"));
      }
    });
  }

  const heldBadges = (badges ?? []).filter((b) => heldIds.includes(b.id));
  const availableBadges = (badges ?? []).filter((b) => !heldIds.includes(b.id));

  return (
    <div className="flex flex-col gap-2">
      {/* Positioned relative to the card (the nearest `relative` ancestor
          is the row div in admin/users/page.tsx, not this component). */}
      {!isSelf && (
        <button
          type="button"
          disabled={isPending}
          onClick={handleDelete}
          aria-label={t("delete")}
          title={t("delete")}
          className={cn(
            buttonVariants({ variant: "outline", size: "icon-sm" }),
            "absolute top-3 right-3 z-10 bg-card/70 hover:text-destructive hover:border-destructive/40"
          )}
        >
          <Trash2 size={14} />
        </button>
      )}

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
      </div>

      {badges && badges.length > 0 && (
        <div className="flex flex-col gap-2">
          <label className="text-[0.65rem] uppercase tracking-widest text-foreground/40">
            {t("badgesLabel")}
          </label>

          {heldBadges.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {heldBadges.map((b) => (
                <span key={b.id} className="inline-flex items-center gap-1">
                  <BadgeChip name={b.name} icon={b.icon} color={b.color} size="sm" />
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleRevokeBadge(b.id)}
                    aria-label={t("revokeBadge", { name: b.name })}
                    className="text-foreground/30 hover:text-destructive transition-colors disabled:opacity-50"
                  >
                    <X size={13} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {availableBadges.length > 0 && (
            <div className="flex items-center gap-2">
              <select
                value={pickerValue}
                disabled={isPending}
                onChange={(e) => setPickerValue(e.target.value)}
                className="rounded-lg border border-primary/20 bg-card/50 px-2.5 py-1.5 text-xs text-foreground/90 focus:outline-none focus:border-primary/50 disabled:opacity-50"
              >
                <option value="">{t("selectBadge")}</option>
                {availableBadges.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <FormButton
                variant="outline"
                className="px-3 py-1.5 text-xs"
                disabled={isPending || !pickerValue}
                onClick={handleAwardBadge}
              >
                {t("awardBadge")}
              </FormButton>
            </div>
          )}
        </div>
      )}

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
