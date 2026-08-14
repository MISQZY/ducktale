import { useTranslations } from "next-intl";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminContentLoading() {
  const t = useTranslations("AdminContent");

  return (
    <AdminPageShell title={t("title")} description={t("description", { count: 0 })} active="content">
      <div className="w-full flex gap-2" style={{ height: "calc(100vh - 380px)", minHeight: "500px" }}>
        <Skeleton className="w-[20%] h-full rounded-2xl" />
        <Skeleton className="flex-1 h-full rounded-2xl opacity-50" />
      </div>
    </AdminPageShell>
  );
}
