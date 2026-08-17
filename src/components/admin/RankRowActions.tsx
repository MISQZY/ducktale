"use client";

import { useTranslations } from "next-intl";
import { Edit } from "lucide-react";
import { RankFormDialog } from "@/components/admin/RankFormDialog";
import { deleteRank } from "@/lib/actions/admin-ranks";
import { AdminRowActions } from "./AdminRowActions";
import { localizedName, type LocalizedName } from "@/lib/i18n-name";

interface RankRowActionsProps {
  lang: string;
  rank: {
    id:    string;
    group: string;
    name:  LocalizedName;
    icon:  string;
    color: string | null;
  };
  groupSuggestions: string[];
  /** ranks-edit (or isAdmin) — gates the edit dialog. Independent of canDelete (see RESOURCE_ROLE_ACTIONS's doc comment). */
  canEdit: boolean;
  /** ranks-delete (or isAdmin) — gates the delete button specifically. */
  canDelete: boolean;
}

export function RankRowActions({ lang, rank, groupSuggestions, canEdit, canDelete }: RankRowActionsProps) {
  const t = useTranslations("Admin.ranks");

  if (!canEdit && !canDelete) return null;

  const editTrigger = {
    icon: <Edit size={14} />,
    label: t("edit"),
    size: "icon-sm" as const,
    className: "bg-card/70 hover:text-primary hover:border-primary/40",
  };

  return (
    <AdminRowActions
      itemName={localizedName(rank.name, lang)}
      onDelete={() => deleteRank(lang, rank.id)}
      translationsNamespace="Admin.ranks"
      canDelete={canDelete}
      editDialog={
        canEdit ? (
          <RankFormDialog
            lang={lang}
            rank={rank}
            groupSuggestions={groupSuggestions}
            trigger={editTrigger}
          />
        ) : null
      }
    />
  );
}
