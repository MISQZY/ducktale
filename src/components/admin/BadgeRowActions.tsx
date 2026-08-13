"use client";

import { useTranslations } from "next-intl";
import { Edit } from "lucide-react";
import { BadgeFormDialog, type RoleOption } from "@/components/admin/BadgeFormDialog";
import { buttonVariants } from "@/components/ui/button";
import { deleteBadge } from "@/lib/actions/admin-badges";
import { cn } from "@/lib/utils";
import { AdminRowActions } from "./AdminRowActions";

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

  const editButton = (
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
  );

  return (
    <AdminRowActions
      itemName={badge.name}
      onDelete={() => deleteBadge(lang, badge.id)}
      translationsNamespace="Admin.badges"
      editDialog={
        <BadgeFormDialog
          lang={lang}
          badge={badge}
          roleOptions={roleOptions}
          trigger={editButton}
        />
      }
    />
  );
}
