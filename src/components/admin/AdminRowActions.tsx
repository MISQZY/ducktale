"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useConfirm } from "@/components/common/ConfirmDialogProvider";

interface AdminRowActionsProps {
  itemName: string;
  onDelete: () => Promise<void>;
  editDialog: ReactNode;
  translationsNamespace?: "Admin.badges" | "Admin.roles";
}

export function AdminRowActions({
  itemName,
  onDelete,
  editDialog,
  translationsNamespace = "Admin.badges"
}: AdminRowActionsProps) {
  const t = useTranslations(translationsNamespace);
  const confirm = useConfirm();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!(await confirm({ description: t("confirmDelete", { name: itemName }), variant: "destructive" }))) return;
    setError(null);
    startTransition(async () => {
      try {
        await onDelete();
      } catch {
        setError(t("errors.generic"));
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap items-center justify-end gap-1.5">
        {editDialog}
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
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
