"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Trash2, Edit } from "lucide-react";
import { RoleFormDialog } from "@/components/admin/RoleFormDialog";
import { buttonVariants } from "@/components/ui/button";
import { deleteRole } from "@/lib/actions/admin-roles";
import { cn } from "@/lib/utils";

interface RoleRowActionsProps {
  lang: string;
  role: {
    id:    string;
    group: string;
    name:  string;
    icon:  string;
    color: string | null;
  };
  groupSuggestions: string[];
}

export function RoleRowActions({ lang, role, groupSuggestions }: RoleRowActionsProps) {
  const t = useTranslations("Admin.roles");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    if (!window.confirm(t("confirmDelete", { name: role.name }))) return;
    setError(null);
    startTransition(async () => {
      try {
        await deleteRole(lang, role.id);
      } catch {
        setError(t("errors.generic"));
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap items-center justify-end gap-1.5">
        <RoleFormDialog
          lang={lang}
          role={role}
          groupSuggestions={groupSuggestions}
          trigger={
            <button
              type="button"
              aria-label={t("edit")}
              title={t("edit")}
              className={cn(
                buttonVariants({ variant: "outline", size: "icon-sm" }),
                "bg-card/70 hover:text-primary hover:border-primary/40"
              )}
            >
              <Edit size={14} />
            </button>
          }
        />
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
