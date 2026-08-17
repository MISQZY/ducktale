import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";
import { requireResourceRole, getAdminNavAccess } from "@/lib/admin";
import { hasResourceRole } from "@/config/resource-roles";
import { resolveServerEvents } from "@/lib/events";
import { SERVERS } from "@/config/servers";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminEventsTable } from "@/components/admin/AdminEventsTable";
import { EventFormDialog } from "@/components/admin/EventFormDialog";

export default async function AdminEventsPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ sort?: string; order?: string }>;
}) {
  const { lang } = await params;
  const admin = await requireResourceRole(lang, "events-view");
  const canEdit = admin.isAdmin || hasResourceRole(admin.roles, "events-edit");
  const canDelete = admin.isAdmin || hasResourceRole(admin.roles, "events-delete");
  const navAccess = await getAdminNavAccess();
  const { sort: rawSort, order: rawOrder } = await searchParams;

  const sortDir: "asc" | "desc" = rawOrder === "asc" || rawOrder === "desc" ? rawOrder : "asc";
  const sortKey = rawSort === "name" || rawSort === "category" || rawSort === "startAt" ? rawSort : undefined;

  const events = await resolveServerEvents();

  // Small, unpaginated dataset — same reasoning admin/maps' own plain JS
  // sort documents (a handful of rows, not worth a Prisma orderBy round trip
  // per sort click on top of the initial fetch).
  const sorted = [...events].sort((a, b) => {
    if (sortKey === "name") {
      const cmp = a.name[lang as "ru" | "en"]?.localeCompare(b.name[lang as "ru" | "en"] ?? "") ?? 0;
      return sortDir === "asc" ? cmp : -cmp;
    }
    if (sortKey === "category") {
      const cmp = a.category.localeCompare(b.category);
      return sortDir === "asc" ? cmp : -cmp;
    }
    return sortDir === "asc" ? a.startAt - b.startAt : b.startAt - a.startAt;
  });

  const t = await getTranslations("Admin.events");
  const servers = SERVERS.map((s) => ({ id: s.id, name: s.name, emoji: s.emoji }));

  const createSlot = canEdit ? (
    <EventFormDialog
      lang={lang}
      servers={servers}
      trigger={{ icon: <Plus size={16} />, label: t("addEvent") }}
    />
  ) : undefined;

  return (
    <AdminPageShell title={t("title")} description={t("description")} active="events" navAccess={navAccess}>
      <AdminEventsTable
        lang={lang}
        events={sorted}
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
