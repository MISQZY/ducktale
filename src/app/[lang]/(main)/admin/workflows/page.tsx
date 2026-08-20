import { requireResourceRole, getAdminNavAccess } from "@/lib/admin";
import { siteDb } from "@/lib/site-db";
import { getTranslations } from "next-intl/server";
import { WorkflowsManager } from "@/components/admin/WorkflowsManager";
import { AdminPageShell } from "@/components/admin/AdminPageShell";

export default async function AdminWorkflowsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  await requireResourceRole(lang, "workflows-view");
  const navAccess = await getAdminNavAccess();

  const tw = await getTranslations("Admin.workflows");

  const statuses = await siteDb.workflowStatus.findMany({
    include: {
      outgoingTransitions: true,
      incomingTransitions: true
    },
    orderBy: { createdAt: "asc" }
  });

  return (
    <AdminPageShell 
      active="workflows" 
      navAccess={navAccess}
      title={tw("title")}
      description={tw("description")}
    >
      <div className="space-y-6">
        <WorkflowsManager lang={lang} initialStatuses={statuses} />
      </div>
    </AdminPageShell>
  );
}
