import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/lib/admin";
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
  await requireAdmin(lang);

  const t = await getTranslations("AdminContent");
  const files = await listContentFiles();
  const trees = buildContentTrees(files);

  return (
    <AdminPageShell title={t("title")} description={t("description", { count: files.length })} active="content">
      <ContentWorkspace lang={lang} trees={trees} />
    </AdminPageShell>
  );
}
