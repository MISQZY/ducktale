import { getTranslations } from "next-intl/server";
import { getAdminNavAccess } from "@/lib/admin";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { Skeleton } from "@/components/ui/skeleton";
import type { Resource } from "@/config/resource-roles";

export default async function AdminLoading() {
  const t = await getTranslations("Admin");
  const navAccess = await getAdminNavAccess();
  const activeTab = "reports" === "roles" ? "role" : "reports";

  return (
    <AdminPageShell title={t("navReports")} description="..." active={activeTab as Resource} navAccess={navAccess}>
      <div className="w-full h-[600px] rounded-xl border border-primary/20 bg-card/60 p-6 flex flex-col gap-4">
        <Skeleton className="h-10 w-full rounded-md opacity-20" />
        <Skeleton className="flex-1 w-full rounded-md opacity-20" />
      </div>
    </AdminPageShell>
  );
}

