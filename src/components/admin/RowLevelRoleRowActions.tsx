"use client";

import { useTranslations } from "next-intl";
import { Edit } from "lucide-react";
import { RowLevelRoleFormDialog } from "@/components/admin/RowLevelRoleFormDialog";
import { buttonVariants } from "@/components/ui/button";
import { deleteRowLevelRole } from "@/lib/actions/admin-row-level-roles";
import { cn } from "@/lib/utils";
import { AdminRowActions } from "./AdminRowActions";
import type { ResourceRole } from "@/config/resource-roles";
import type { ResourceLabelMap } from "@/lib/resource-role-labels";
import { localizedName, type LocalizedName } from "@/lib/i18n-name";

interface RowLevelRoleRowActionsProps {
  lang: string;
  rowLevelRole: {
    id: string;
    name: LocalizedName;
    resourceRoles: ResourceRole[];
  };
  resourceLabels: ResourceLabelMap;
  /** row-level-roles-edit (or isAdmin) — gates the edit dialog. Independent of canDelete (see RESOURCE_ROLE_ACTIONS's doc comment). */
  canEdit: boolean;
  /** row-level-roles-delete (or isAdmin) — gates the delete button. */
  canDelete: boolean;
}

export function RowLevelRoleRowActions({ lang, rowLevelRole, resourceLabels, canEdit, canDelete }: RowLevelRoleRowActionsProps) {
  const t = useTranslations("Admin.rowLevelRoles");

  if (!canEdit && !canDelete) return null;

  const name = localizedName(rowLevelRole.name, lang);

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
      itemName={name}
      onDelete={() => deleteRowLevelRole(lang, rowLevelRole.id)}
      translationsNamespace="Admin.rowLevelRoles"
      canDelete={canDelete}
      editDialog={
        canEdit ? (
          <RowLevelRoleFormDialog
            lang={lang}
            rowLevelRole={rowLevelRole}
            resourceLabels={resourceLabels}
            trigger={editButton}
          />
        ) : null
      }
    />
  );
}
