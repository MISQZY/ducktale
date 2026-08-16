"use client";

import { useTranslations } from "next-intl";
import { Edit } from "lucide-react";
import { RankFormDialog } from "@/components/admin/RankFormDialog";
import { buttonVariants } from "@/components/ui/button";
import { deleteRank } from "@/lib/actions/admin-ranks";
import { cn } from "@/lib/utils";
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
            trigger={editButton}
          />
        ) : null
      }
    />
  );
}
