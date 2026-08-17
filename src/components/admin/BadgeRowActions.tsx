"use client";

import { useTranslations } from "next-intl";
import { Edit } from "lucide-react";
import { BadgeFormDialog, type RoleOption } from "@/components/admin/BadgeFormDialog";
import { deleteBadge } from "@/lib/actions/admin-badges";
import { AdminRowActions } from "./AdminRowActions";
import { localizedName, type LocalizedName } from "@/lib/i18n-name";

interface BadgeRowActionsProps {
  lang: string;
  badge: {
    id: string;
    name: LocalizedName;
    description: string | null;
    earnCondition: string | null;
    icon: string;
    color: string | null;
    autoRoleIds: string[];
  };
  roleOptions: RoleOption[];
  /** badges-edit (or isAdmin) — gates the edit dialog. Independent of canDelete (see RESOURCE_ROLE_ACTIONS's doc comment). */
  canEdit: boolean;
  /** badges-delete (or isAdmin) — gates the delete button specifically. */
  canDelete: boolean;
}

export function BadgeRowActions({ lang, badge, roleOptions, canEdit, canDelete }: BadgeRowActionsProps) {
  const t = useTranslations("Admin.badges");

  if (!canEdit && !canDelete) return null;

  const editTrigger = {
    icon: <Edit size={14} />,
    label: t("edit"),
    size: "icon-sm" as const,
    className: "bg-card/70 hover:text-primary hover:border-primary/40",
  };

  return (
    <AdminRowActions
      itemName={localizedName(badge.name, lang)}
      onDelete={() => deleteBadge(lang, badge.id)}
      translationsNamespace="Admin.badges"
      canDelete={canDelete}
      editDialog={
        canEdit ? (
          <BadgeFormDialog
            lang={lang}
            badge={badge}
            roleOptions={roleOptions}
            trigger={editTrigger}
          />
        ) : null
      }
    />
  );
}
