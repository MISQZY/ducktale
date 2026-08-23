"use client";

import { useTranslations } from "next-intl";
import { Edit } from "lucide-react";
import { NewsFormDialog, type NewsServerOption } from "@/components/admin/NewsFormDialog";
import { deleteNewsPost } from "@/lib/actions/admin-news";
import { AdminRowActions } from "./AdminRowActions";
import { localizedName, type LocalizedName } from "@/lib/i18n-name";
import type { NewsCategory } from "@/config/news";

interface NewsRowActionsProps {
  lang: string;
  news: {
    id: string;
    scope: "site" | "server";
    serverId: string | null;
    icon: string;
    category: NewsCategory;
    title: LocalizedName;
    content: LocalizedName;
    publishedAt: number;
    href: string | null;
  };
  servers: NewsServerOption[];
  /** news-edit (or isAdmin) — gates the edit dialog. Independent of canDelete (see RESOURCE_ROLE_ACTIONS's doc comment). */
  canEdit: boolean;
  /** news-delete (or isAdmin) — gates the delete button specifically. */
  canDelete: boolean;
}

export function NewsRowActions({ lang, news, servers, canEdit, canDelete }: NewsRowActionsProps) {
  const t = useTranslations("Admin.news");

  if (!canEdit && !canDelete) return null;

  const editTrigger = {
    icon: <Edit size={14} />,
    label: t("edit"),
    size: "icon-sm" as const,
    className: "bg-card/70 hover:text-primary hover:border-primary/40",
  };

  return (
    <AdminRowActions
      itemName={localizedName(news.title, lang)}
      onDelete={() => deleteNewsPost(lang, news.id)}
      translationsNamespace="Admin.news"
      canDelete={canDelete}
      editDialog={canEdit ? <NewsFormDialog lang={lang} news={news} servers={servers} trigger={editTrigger} /> : null}
    />
  );
}
