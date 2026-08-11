"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { FormButton } from "@/components/common/FormButton";
import { BadgeFormDialog } from "@/components/admin/BadgeFormDialog";
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
  };
}

export function BadgeRowActions({ lang, badge }: BadgeRowActionsProps) {
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
    <div className="flex flex-col gap-2">
      {/* Positioned relative to the card (the nearest `relative` ancestor
          is the row div in admin/badges/page.tsx, not this component). */}
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

      <div className="flex flex-wrap items-center gap-2">
        <BadgeFormDialog
          lang={lang}
          badge={badge}
          trigger={
            <FormButton variant="outline" className="px-4 py-1.5 text-xs">
              {t("edit")}
            </FormButton>
          }
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
