import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";
import { requireResourceRole, getAdminNavAccess } from "@/lib/admin";
import { hasResourceRole, type ResourceRole } from "@/config/resource-roles";
import { siteDb } from "@/lib/site-db";
import { seedBuiltinRoles } from "@/lib/roles";
import { getResourceLabels } from "@/lib/resource-role-labels";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { RoleFormDialog, type RoleOption, type RowLevelRoleOption } from "@/components/admin/RoleFormDialog";
import { AdminRolesTable, type AdminRoleRow } from "@/components/admin/AdminRolesTable";
import type { LocalizedName } from "@/lib/i18n-name";

/** Admin-composed bundles of resource-roles, assigned to users — see [[PERMISSIONS_BADGES]] §4.1. Small expected N, unpaginated like Ranks. */
export default async function AdminRolesPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const admin = await requireResourceRole(lang, "role-view");
  const navAccess = await getAdminNavAccess();
  const canEdit = admin.isAdmin || hasResourceRole(admin.roles, "role-edit");
  const canDelete = admin.isAdmin || hasResourceRole(admin.roles, "role-delete");

  // Idempotent (only creates a missing key, never overwrites) — cheap
  // enough to run on every load, guarantees "guest"/"user"/"super-admin"
  // always show up here even if this is the first time anyone's visited
  // this page.
  await seedBuiltinRoles();

  const roleRows = await siteDb.role.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      isLocked: true,
      key: true,
      resourceRoles: { select: { resourceRole: true } },
      includes: { select: { includedRoleId: true } },
      rowLevelRoles: { select: { rowLevelRoleId: true } },
      _count: { select: { users: true } },
    },
  });

  const roles: AdminRoleRow[] = roleRows.map((r) => ({
    id: r.id,
    name: r.name as unknown as LocalizedName,
    resourceRoles: r.resourceRoles.map((rr) => rr.resourceRole as ResourceRole),
    includedRoleIds: r.includes.map((inc) => inc.includedRoleId),
    rowLevelRoleIds: r.rowLevelRoles.map((rlr) => rlr.rowLevelRoleId),
    userCount: r._count.users,
    isSystem: r.key !== null,
    isGuest: r.key === "guest",
    isLocked: r.isLocked,
  }));

  const roleOptions: RoleOption[] = roles.map((r) => ({ id: r.id, name: r.name }));

  const rowLevelRoleRows = await siteDb.rowLevelRole.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true },
  });
  const rowLevelRoleOptions: RowLevelRoleOption[] = rowLevelRoleRows.map((r) => ({
    id: r.id,
    name: r.name as unknown as LocalizedName,
  }));

  const resourceLabels = await getResourceLabels();

  const tr = await getTranslations("Admin.roles");

  const createSlot = canEdit ? (
    <RoleFormDialog
      key="create"
      lang={lang}
      roleOptions={roleOptions}
      rowLevelRoleOptions={rowLevelRoleOptions}
      resourceLabels={resourceLabels}
      trigger={{ icon: <Plus size={16} />, label: tr("createTitle") }}
    />
  ) : undefined;

  return (
    <AdminPageShell title={tr("title")} description={tr("description", { count: roles.length })} active="role" navAccess={navAccess}>
      <AdminRolesTable lang={lang} roles={roles} rowLevelRoleOptions={rowLevelRoleOptions} resourceLabels={resourceLabels} canEdit={canEdit} canDelete={canDelete} createSlot={createSlot} />
    </AdminPageShell>
  );
}
