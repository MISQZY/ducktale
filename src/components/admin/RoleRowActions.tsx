"use client";

import { useTranslations } from "next-intl";
import { Edit } from "lucide-react";
import { RoleFormDialog, type RoleOption, type RowLevelRoleOption } from "@/components/admin/RoleFormDialog";
import { deleteRole } from "@/lib/actions/admin-roles";
import { AdminRowActions } from "./AdminRowActions";
import type { ResourceRole } from "@/config/resource-roles";
import type { ResourceLabelMap } from "@/lib/resource-role-labels";
import { localizedName, type LocalizedName } from "@/lib/i18n-name";

interface RoleRowActionsProps {
  lang: string;
  role: {
    id: string;
    name: LocalizedName;
    resourceRoles: ResourceRole[];
    includedRoleIds: string[];
    rowLevelRoleIds: string[];
    isSystem: boolean;
    isLocked: boolean;
  };
  /** Every other Role, for RoleFormDialog's "include roles" picker — this row's own id already excluded by the caller. */
  roleOptions: RoleOption[];
  /** Every RowLevelRole, for RoleFormDialog's "pull in row-level roles" picker. */
  rowLevelRoleOptions: RowLevelRoleOption[];
  resourceLabels: ResourceLabelMap;
  /** role-edit (or isAdmin) — gates the edit dialog. Independent of canDelete (see RESOURCE_ROLE_ACTIONS's doc comment). */
  canEdit: boolean;
  /** role-delete (or isAdmin) — gates the delete button, combined below with `!role.isSystem` (built-in roles can't be deleted regardless of permission). */
  canDelete: boolean;
}

export function RoleRowActions({ lang, role, roleOptions, rowLevelRoleOptions, resourceLabels, canEdit, canDelete }: RoleRowActionsProps) {
  const t = useTranslations("Admin.roles");

  if (!canEdit && !(canDelete && !role.isSystem)) return null;

  const name = localizedName(role.name, lang);

  // A locked built-in Role (none today — see Role.isLocked's doc comment in
  // the schema) still allows renaming (RoleFormDialog hides everything else
  // for it); only deletion is unconditionally blocked, same as any other
  // built-in.
  const editTrigger = {
    icon: <Edit size={14} />,
    label: t("edit"),
    size: "icon-sm" as const,
    className: "bg-card/70 hover:text-primary hover:border-primary/40",
  };

  return (
    <AdminRowActions
      itemName={name}
      onDelete={() => deleteRole(lang, role.id)}
      translationsNamespace="Admin.roles"
      canDelete={canDelete && !role.isSystem}
      editDialog={
        canEdit ? (
          <RoleFormDialog
            lang={lang}
            role={role}
            roleOptions={roleOptions}
            rowLevelRoleOptions={rowLevelRoleOptions}
            resourceLabels={resourceLabels}
            trigger={editTrigger}
          />
        ) : null
      }
    />
  );
}
