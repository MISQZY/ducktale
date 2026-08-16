import { useTranslations } from "next-intl";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { Skeleton } from "@/components/ui/skeleton";
import { RESOURCE_ROLE_ACTIONS, type Resource } from "@/config/resource-roles";

// This skeleton renders before the real access check (in page.tsx) resolves,
// so it has no session to derive real tab visibility from — shows every tab
// for that instant, same as before AdminNav gained per-viewer visibility.
// Purely cosmetic: no data or actions are exposed here, just tab labels.
const ALL_NAV_ACCESS = Object.fromEntries(
  Object.keys(RESOURCE_ROLE_ACTIONS).map((resource) => [resource, true])
) as Record<Resource, boolean>;

export default function AdminContentLoading() {
  const t = useTranslations("AdminContent");

  return (
    <AdminPageShell title={t("title")} description={t("description", { count: 0 })} active="content" navAccess={ALL_NAV_ACCESS}>
      <div className="w-full flex gap-2" style={{ height: "calc(100vh - 380px)", minHeight: "500px" }}>
        <Skeleton className="w-[20%] h-full rounded-2xl" />
        <Skeleton className="flex-1 h-full rounded-2xl opacity-50" />
      </div>
    </AdminPageShell>
  );
}
