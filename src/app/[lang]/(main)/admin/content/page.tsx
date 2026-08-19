import { getTranslations } from "next-intl/server";
import { requireResourceRole, getAdminNavAccess } from "@/lib/admin";
import { hasResourceRole } from "@/config/resource-roles";
import { listContentFiles } from "@/lib/admin-content";
import { buildContentTrees } from "@/lib/content-tree";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { ContentWorkspace } from "@/components/admin/ContentWorkspace";

export default async function AdminContentPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  // content has no -view of its own — reaching this page at all already
  // requires content-edit (see RESOURCE_ROLE_ACTIONS's doc comment).
  // content-delete is checked separately, only for the delete button inside
  // the workspace.
  const admin = await requireResourceRole(lang, "content-view");
  const canEdit = admin.isAdmin || hasResourceRole(admin.roles, "content-edit");
  const canDelete = admin.isAdmin || hasResourceRole(admin.roles, "content-delete");
  const navAccess = await getAdminNavAccess();

  const t = await getTranslations("AdminContent");
  const files = await listContentFiles();
  const trees = buildContentTrees(files);

  return (
    <AdminPageShell title={t("title")} description={t("description", { count: files.length })} active="content" navAccess={navAccess}>
      <ContentWorkspace lang={lang} trees={trees} canEdit={canEdit} canDelete={canDelete} />
    </AdminPageShell>
  );
}
