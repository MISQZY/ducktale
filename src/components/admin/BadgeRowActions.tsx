"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Trash2, Edit } from "lucide-react";
import { FormButton } from "@/components/common/FormButton";
import { BadgeFormDialog, type RoleOption } from "@/components/admin/BadgeFormDialog";
import { buttonVariants } from "@/components/ui/button";
import { deleteBadge } from "@/lib/actions/admin-badges";
import { cn } from "@/lib/utils";

interface BadgeRowActionsProps {
  lang: string;
  badge: {
    id: string;
    name: string;
    description: string | null;
    earnCondition: string | null;
    icon: string;
    color: string | null;
    autoRoleIds: string[];
  };
  roleOptions: RoleOption[];
}

export function BadgeRowActions({ lang, badge, roleOptions }: BadgeRowActionsProps) {
  const t = useTranslations("Admin.badges");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    if (!window.confirm(t("confirmDelete", { name: badge.name }))) return;
    setError(null);
    startTransition(async () => {
      try {
        await deleteBadge(lang, badge.id);
      } catch {
        setError(t("errors.generic"));
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap items-center justify-end gap-1.5">
        <BadgeFormDialog
          lang={lang}
          badge={badge}
          roleOptions={roleOptions}
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
