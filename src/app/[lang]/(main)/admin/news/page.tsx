import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";
import { requireResourceRole, getAdminNavAccess } from "@/lib/admin";
import { hasResourceRole } from "@/config/resource-roles";
import { resolveNewsPosts } from "@/lib/news";
import { SERVERS } from "@/config/servers";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminNewsTable } from "@/components/admin/AdminNewsTable";
import { NewsFormDialog } from "@/components/admin/NewsFormDialog";

export default async function AdminNewsPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ sort?: string; order?: string }>;
}) {
  const { lang } = await params;
  const admin = await requireResourceRole(lang, "news-view");
  const canEdit = admin.isAdmin || hasResourceRole(admin.roles, "news-edit");
  const canDelete = admin.isAdmin || hasResourceRole(admin.roles, "news-delete");
  const navAccess = await getAdminNavAccess();
  const { sort: rawSort, order: rawOrder } = await searchParams;

  const sortDir: "asc" | "desc" = rawOrder === "asc" || rawOrder === "desc" ? rawOrder : "desc";
  const sortKey = rawSort === "title" || rawSort === "category" || rawSort === "publishedAt" ? rawSort : undefined;

  const news = await resolveNewsPosts();

  // Small, unpaginated dataset — same reasoning admin/events' own plain JS
  // sort documents.
  const sorted = [...news].sort((a, b) => {
    if (sortKey === "title") {
      const cmp = a.title[lang as "ru" | "en"]?.localeCompare(b.title[lang as "ru" | "en"] ?? "") ?? 0;
      return sortDir === "asc" ? cmp : -cmp;
    }
    if (sortKey === "category") {
      const cmp = a.category.localeCompare(b.category);
      return sortDir === "asc" ? cmp : -cmp;
    }
    return sortDir === "asc" ? a.publishedAt - b.publishedAt : b.publishedAt - a.publishedAt;
  });

  const t = await getTranslations("Admin.news");
  const servers = SERVERS.map((s) => ({ id: s.id, name: s.name, emoji: s.emoji }));

  const createSlot = canEdit ? (
    <NewsFormDialog
      lang={lang}
      servers={servers}
      trigger={{ icon: <Plus size={16} />, label: t("addNews") }}
    />
  ) : undefined;

  return (
    <AdminPageShell title={t("title")} description={t("description")} active="news" navAccess={navAccess}>
      <AdminNewsTable
        lang={lang}
        news={sorted}
        servers={servers}
        canEdit={canEdit}
        canDelete={canDelete}
        sortColumn={sortKey}
        sortDirection={sortKey ? sortDir : undefined}
        createSlot={createSlot}
      />
    </AdminPageShell>
  );
}
