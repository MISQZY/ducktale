"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Trash2, Pencil } from "lucide-react";
import { deleteUser } from "@/lib/actions/admin";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useConfirm } from "@/components/common/ConfirmDialogProvider";

interface AdminUserActionsProps {
  lang: string;
  userId: string;
  nickname: string;
  isSelf: boolean;
  /** users-edit OR role-edit (or isAdmin) — gates the edit-dialog trigger, since that dialog is also the only way to reach role assignment. Independent of canDelete (see RESOURCE_ROLE_ACTIONS's doc comment) — a users-view-only holder sees neither. */
  canEdit: boolean;
  /** users-delete (or isAdmin) — gates the delete button specifically, separate from canEdit. */
  canDelete: boolean;
  onEdit: () => void;
}

export function AdminUserActions({ lang, userId, nickname, isSelf, canEdit, canDelete, onEdit }: AdminUserActionsProps) {
  const t = useTranslations("Admin");
  const confirm = useConfirm();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

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

  if (!canEdit && !canDelete) return null;

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap items-center justify-end gap-1.5">
        {canEdit && (
          <button
            type="button"
            aria-label={t("editUser")}
            title={t("editUser")}
            onClick={onEdit}
            className={cn(
              buttonVariants({ variant: "outline", size: "icon-sm" }),
              "bg-card/70 hover:text-primary hover:border-primary/40"
            )}
          >
            <Pencil size={14} />
          </button>
        )}

        {canDelete && !isSelf && (
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

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
