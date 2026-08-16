import { getTranslations } from "next-intl/server";
import { requireResourceRole, getAdminNavAccess } from "@/lib/admin";
import { hasResourceRole, RESOURCE_ROLE_ACTIONS, RESOURCE_ROLES, type Resource } from "@/config/resource-roles";
import { getResourceLabels } from "@/lib/resource-role-labels";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminResourceRolesTable, type AdminResourceRoleRow } from "@/components/admin/AdminResourceRolesTable";

/** Read-only reference catalog for the resource-role catalog itself (src/config/resource-roles.ts) — the only "edit" here is renaming a resource's display label (ResourceRoleLabel override), not the fixed set of resources/actions. */
export default async function AdminResourceRolesPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const admin = await requireResourceRole(lang, "resource-roles-view");
  const navAccess = await getAdminNavAccess();
  const canEdit = admin.isAdmin || hasResourceRole(admin.roles, "resource-roles-edit");

  const labels = await getResourceLabels();

  // Fixed catalog order, one row per resource (not per resource-role pair
  // anymore — View/Edit are now two columns on the same row, see
  // ResourceRoleAccessGrid's doc comment), not a DB query result — every row
  // always exists.
  const rows: AdminResourceRoleRow[] = (Object.keys(RESOURCE_ROLE_ACTIONS) as Resource[]).map((resource) => ({
    resource,
    resourceNameRu: labels[resource].ru,
    resourceNameEn: labels[resource].en,
  }));

  const tr = await getTranslations("Admin.resourceRoles");

  return (
    <AdminPageShell title={tr("title")} description={tr("description", { count: RESOURCE_ROLES.length })} active="resource-roles" navAccess={navAccess}>
      <div className="w-full">
        <div className="min-h-[42vh]">
          <AdminResourceRolesTable lang={lang} rows={rows} canEdit={canEdit} />
        </div>
      </div>
    </AdminPageShell>
  );
}
