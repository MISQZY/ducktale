import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";
import { requireResourceRole, getAdminNavAccess } from "@/lib/admin";
import { hasResourceRole, type ResourceRole } from "@/config/resource-roles";
import { siteDb } from "@/lib/site-db";
import { getResourceLabels } from "@/lib/resource-role-labels";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { RowLevelRoleFormDialog } from "@/components/admin/RowLevelRoleFormDialog";
import { AdminRowLevelRolesTable, type AdminRowLevelRoleRow } from "@/components/admin/AdminRowLevelRolesTable";
import type { LocalizedName } from "@/lib/i18n-name";

/** Admin-composed bundles of resource-roles, pulled into a Role rather than assigned to a user directly — see RowLevelRole's doc comment in the schema. Small expected N, unpaginated like Ranks/Roles. */
export default async function AdminRowLevelRolesPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const admin = await requireResourceRole(lang, "row-level-roles-view");
  const navAccess = await getAdminNavAccess();
  const canEdit = admin.isAdmin || hasResourceRole(admin.roles, "row-level-roles-edit");
  const canDelete = admin.isAdmin || hasResourceRole(admin.roles, "row-level-roles-delete");

  const rowLevelRoleRows = await siteDb.rowLevelRole.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      resourceRoles: { select: { resourceRole: true } },
      _count: { select: { roles: true } },
    },
  });

  const rowLevelRoles: AdminRowLevelRoleRow[] = rowLevelRoleRows.map((r) => ({
    id: r.id,
    name: r.name as unknown as LocalizedName,
    resourceRoles: r.resourceRoles.map((rr) => rr.resourceRole as ResourceRole),
    roleCount: r._count.roles,
  }));

  const resourceLabels = await getResourceLabels();

  const tr = await getTranslations("Admin.rowLevelRoles");

  const createSlot = canEdit ? (
    <RowLevelRoleFormDialog
      lang={lang}
      resourceLabels={resourceLabels}
      trigger={{ icon: <Plus size={16} />, label: tr("createTitle") }}
    />
  ) : undefined;

  return (
    <AdminPageShell title={tr("title")} description={tr("description", { count: rowLevelRoles.length })} active="row-level-roles" navAccess={navAccess}>
      <AdminRowLevelRolesTable lang={lang} rowLevelRoles={rowLevelRoles} resourceLabels={resourceLabels} canEdit={canEdit} canDelete={canDelete} createSlot={createSlot} />
    </AdminPageShell>
  );
}
