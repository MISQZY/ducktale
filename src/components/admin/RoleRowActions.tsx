"use client";

import { useTranslations } from "next-intl";
import { Edit } from "lucide-react";
import { RoleFormDialog } from "@/components/admin/RoleFormDialog";
import { buttonVariants } from "@/components/ui/button";
import { deleteRole } from "@/lib/actions/admin-roles";
import { cn } from "@/lib/utils";
import { AdminRowActions } from "./AdminRowActions";

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
      itemName={role.name}
      onDelete={() => deleteRole(lang, role.id)}
      translationsNamespace="Admin.roles"
      editDialog={
        <RoleFormDialog
          lang={lang}
          role={role}
          groupSuggestions={groupSuggestions}
          trigger={editButton}
        />
      }
    />
  );
}
