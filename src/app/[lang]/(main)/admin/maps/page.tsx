import { getTranslations } from "next-intl/server";
import { requireResourceRole, getAdminNavAccess } from "@/lib/admin";
import { hasResourceRole } from "@/config/resource-roles";
import { SERVERS } from "@/config/servers";
import { resolveServerMaps } from "@/lib/maps";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminMapsTable } from "@/components/admin/AdminMapsTable";
import { MapFormDialog } from "@/components/admin/MapFormDialog";
import { FormButton } from "@/components/common/FormButton";
import { localizedName } from "@/lib/i18n-name";

export default async function AdminMapsPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ sort?: string; order?: string }>;
}) {
  const { lang } = await params;
  const admin = await requireResourceRole(lang, "maps-view");
  const canEdit = admin.isAdmin || hasResourceRole(admin.roles, "maps-edit");
  const canDelete = admin.isAdmin || hasResourceRole(admin.roles, "maps-delete");
  const navAccess = await getAdminNavAccess();
  const { sort: rawSort, order: rawOrder } = await searchParams;

  const sortDir: "asc" | "desc" = rawOrder === "asc" || rawOrder === "desc" ? rawOrder : "asc";
  const sortKey = rawSort === "server" || rawSort === "name" ? rawSort : undefined;

  const maps = await resolveServerMaps();
  const servers = SERVERS.map((s) => ({ id: s.id, name: s.name, emoji: s.emoji }));
  const serverOrder = new Map(SERVERS.map((s, i) => [s.id, i]));

  // Small, unpaginated dataset (a handful of maps per server at most) — a
  // plain JS sort here instead of a Prisma orderBy/skip/take round trip,
  // same reasoning ContentWorkspace's tree skips pagination for.
  const sorted = [...maps].sort((a, b) => {
    if (sortKey === "name") {
      const cmp = localizedName(a.name, lang).localeCompare(localizedName(b.name, lang));
      return sortDir === "asc" ? cmp : -cmp;
    }
    const cmp = (serverOrder.get(a.serverId) ?? 0) - (serverOrder.get(b.serverId) ?? 0);
    if (cmp !== 0) return sortDir === "asc" ? cmp : -cmp;
    return localizedName(a.name, lang).localeCompare(localizedName(b.name, lang));
  });

  const t = await getTranslations("Admin.maps");

  return (
    <AdminPageShell title={t("title")} description={t("description")} active="maps" navAccess={navAccess}>
      {canEdit && (
        <div className="flex justify-center mb-6">
          <MapFormDialog
            lang={lang}
            servers={servers}
            trigger={<FormButton className="px-5 py-2 text-xs">{t("addMap")}</FormButton>}
          />
        </div>
      )}

      <AdminMapsTable
        lang={lang}
        maps={sorted}
        servers={servers}
        canEdit={canEdit}
        canDelete={canDelete}
        sortColumn={sortKey}
        sortDirection={sortKey ? sortDir : undefined}
      />
    </AdminPageShell>
  );
}
