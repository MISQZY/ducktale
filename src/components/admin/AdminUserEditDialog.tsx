"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { KeyRound, Unlink } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { FormInput } from "@/components/common/FormInput";
import { FormButton } from "@/components/common/FormButton";
import { buttonVariants } from "@/components/ui/button";
import CopyToClipboard from "@/components/ui/CopyToClipboard";
import { cn } from "@/lib/utils";
import { useConfirm } from "@/components/common/ConfirmDialogProvider";
import { renameUser, resetUserPassword, unlinkUser } from "@/lib/actions/admin";
import { setUserRoles } from "@/lib/actions/admin-roles";
import { NICKNAME_MAX_LENGTH } from "@/lib/nickname";
import { UserRolesButton } from "./UserRolesButton";
import type { RoleOption } from "./RoleFormDialog";
import type { AdminUserRow } from "./AdminUsersTable";

interface AdminUserEditDialogProps {
  lang: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AdminUserRow | null;
  /** users-edit (or isAdmin) — gates rename/reset-password/unlink. In practice this dialog only ever opens from a canEdit-gated button (AdminUserActions), but the check is repeated here too rather than trusted from the caller. */
  canEdit: boolean;
  /**
   * role-edit (or isAdmin) — gates the roles-assignment button. There is no
   * dedicated isAdmin grant/revoke control in this dialog anymore; the
   * closest equivalent is assigning the built-in "super-admin" Role
   * (src/config/roles.ts, seeded with every resource-role) via this button
   * — note that's a full resource-role grant, not the real User.isAdmin
   * superadmin bypass, which the two remain independent of.
   */
  canManageRoles: boolean;
  roleOptions: RoleOption[];
}

const iconButtonClasses = cn(
  buttonVariants({ variant: "outline", size: "icon-sm" }),
  "bg-card/70 hover:text-primary hover:border-primary/40"
);

/**
 * A single shared instance, owned by AdminUsersTable (not one per row — see
 * that component's `editingUser` state) rather than each row mounting its
 * own <Dialog>. Every action here calls a Server Action that
 * revalidatePath()s /admin, which patches AdminUsersTable's `users` prop —
 * a per-row-embedded dialog sat inside that revalidation-vulnerable subtree
 * (a TanStack cell renderer several layers deep) and lost its open state
 * to it right after a successful action; AdminUsersTable itself, a single
 * stable component at a fixed tree position, isn't at risk of that the
 * same way a plain prop update doesn't reset a component's own local state.
 */
export function AdminUserEditDialog({ lang, open, onOpenChange, user, canEdit, canManageRoles, roleOptions }: AdminUserEditDialogProps) {
  const t = useTranslations("Admin");
  const confirm = useConfirm();

  // Initial state reads straight from `user` rather than syncing via an
  // effect: the parent (AdminUsersTable) keys this component by
  // editingUser?.id, so switching to a *different* user remounts it fresh
  // automatically — the case this state actually needs to reset for. A
  // revalidation-driven prop update for the *same* user (see this
  // component's doc comment) doesn't change the key, so it correctly
  // leaves an in-progress edit/resetLink/etc. alone instead of wiping it.
  const [nicknameValue, setNicknameValue] = useState(user?.nickname ?? "");
  // The confirmed-on-server nickname — separate from `user.nickname` (a
  // prop that stays stale until the next revalidation actually lands) and
  // from `nicknameValue` (the live, possibly-unsaved input). The title and
  // the Save button's "anything to save?" check both read this, so a
  // successful rename updates them immediately instead of still showing
  // the old name / a still-enabled Save button until props catch up.
  const [savedNickname, setSavedNickname] = useState(user?.nickname ?? "");

  // Same staged/confirmed split as nickname above, but for Role membership —
  // UserRolesButton is a controlled checklist now (no per-checkbox
  // persistence), so its selection only takes effect when Save runs.
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>(user?.roleIds ?? []);
  const [savedRoleIds, setSavedRoleIds] = useState<string[]>(user?.roleIds ?? []);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [resetLink, setResetLink] = useState<string | null>(null);
  const [linked, setLinked] = useState(user?.isLinked ?? false);

  // Shared by reset/unlink — these are mutually exclusive actions on the
  // same user, not independent operations, so one running disables the
  // other too (matches the pre-dialog inline buttons, which shared a single
  // isPending from one useTransition).
  const [actionPending, setActionPending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const nicknameDirty = nicknameValue.trim() !== savedNickname;
  const rolesDirty = (() => {
    if (selectedRoleIds.length !== savedRoleIds.length) return true;
    const savedSet = new Set(savedRoleIds);
    return selectedRoleIds.some((id) => !savedSet.has(id));
  })();

  async function handleSave() {
    if (!user) return;
    // Unlike rename (reversible, low-impact), a Role change can grant or
    // revoke real access immediately — same "are you sure?" bar as
    // reset-password/unlink below, which this used to skip entirely.
    if (rolesDirty && !(await confirm({ description: t("confirmRoleChange", { nickname: savedNickname }) }))) return;
    setSaveError(null);
    setSaving(true);
    try {
      if (nicknameDirty) {
        const saved = await renameUser(lang, user.id, nicknameValue);
        setSavedNickname(saved);
        setNicknameValue(saved);
      }
      if (rolesDirty) {
        // setUserRoles falls back to the built-in "guest" Role server-side
        // if `selectedRoleIds` is empty (every user must hold at least one
        // Role) — the returned ids reflect that so the checklist and the
        // dirty-check both settle on what actually got persisted.
        const finalRoleIds = await setUserRoles(lang, user.id, selectedRoleIds);
        setSavedRoleIds(finalRoleIds);
        setSelectedRoleIds(finalRoleIds);
      }
    } catch (err) {
      setSaveError((err instanceof Error && err.message) || t("actionFailed"));
    } finally {
      setSaving(false);
    }
  }

  async function handleResetPassword() {
    if (!user) return;
    if (!(await confirm({ description: t("confirmReset", { nickname: savedNickname }) }))) return;
    setActionError(null);
    setActionPending(true);
    try {
      setResetLink(await resetUserPassword(lang, user.id));
    } catch {
      setActionError(t("actionFailed"));
    } finally {
      setActionPending(false);
    }
  }

  async function handleUnlink() {
    if (!user) return;
    if (!(await confirm({ description: t("confirmUnlink", { nickname: savedNickname }) }))) return;
    setActionError(null);
    setActionPending(true);
    try {
      await unlinkUser(lang, user.id);
      setLinked(false);
    } catch {
      setActionError(t("actionFailed"));
    } finally {
      setActionPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle
            className="text-2xl text-primary/90 text-center leading-tight mb-2"
            style={{ fontFamily: "var(--font-body)" }}
          >
            {t("editUserTitle", { nickname: savedNickname })}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-5 min-w-0">
          <div className="flex flex-col gap-2">
            <FormInput
              id="admin-user-nickname"
              label={t("nicknameLabel")}
              value={nicknameValue}
              onChange={(e) => setNicknameValue(e.target.value)}
              maxLength={NICKNAME_MAX_LENGTH}
              disabled={!canEdit}
              required
            />
          </div>

          <div className="h-px bg-border" />

          <div className="flex flex-col gap-2 min-w-0">
            <div className="flex items-center gap-1.5">
              {canEdit && (
                <button
                  type="button"
                  aria-label={t("resetPassword")}
                  title={t("resetPassword")}
                  disabled={actionPending}
                  onClick={handleResetPassword}
                  className={iconButtonClasses}
                >
                  <KeyRound size={14} />
                </button>
              )}

              {canManageRoles && user && (
                <UserRolesButton
                  lang={lang}
                  roleOptions={roleOptions}
                  selectedRoleIds={selectedRoleIds}
                  onChange={setSelectedRoleIds}
                  iconButtonClasses={iconButtonClasses}
                />
              )}

              {canEdit && linked && (
                <button
                  type="button"
                  aria-label={t("unlink")}
                  title={t("unlink")}
                  disabled={actionPending}
                  onClick={handleUnlink}
                  className={cn(iconButtonClasses, "hover:text-destructive hover:border-destructive/40")}
                >
                  <Unlink size={14} />
                </button>
              )}
            </div>

            {resetLink && (
              <div className="text-xs text-foreground/60 min-w-0">
                <p className="mb-1">{t("newPasswordHint")}</p>
                <CopyToClipboard value={resetLink} className="min-w-0">
                  <div
                    className="flex items-center gap-2 rounded-lg bg-muted border border-primary/20 px-3 py-2 cursor-pointer max-w-full min-w-0 overflow-x-auto custom-scrollbar"
                    title={resetLink}
                  >
                    <span className="font-mono text-sm text-foreground tracking-wide whitespace-nowrap">
                      {resetLink}
                    </span>
                  </div>
                </CopyToClipboard>
              </div>
            )}

            {actionError && <p className="text-xs text-destructive">{actionError}</p>}
          </div>

          {saveError && <p className="text-xs text-destructive">{saveError}</p>}
        </div>

        {(canEdit || canManageRoles) && (
          <DialogFooter>
            <FormButton
              disabled={saving || !user || (!nicknameDirty && !rolesDirty)}
              onClick={handleSave}
              className="w-full sm:w-auto"
            >
              {saving ? t("saving") : t("save")}
            </FormButton>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
