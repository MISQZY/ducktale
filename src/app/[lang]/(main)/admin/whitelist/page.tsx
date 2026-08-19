import { getTranslations } from "next-intl/server";
import { requireResourceRole, getAdminNavAccess } from "@/lib/admin";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { WhitelistTable } from "@/components/whitelist/WhitelistTable";

export default async function AdminWhitelistPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  await requireResourceRole(lang, "whitelist-view");
  const navAccess = await getAdminNavAccess();
  const t = await getTranslations("Admin");

  return (
    <AdminPageShell
      title={t("navWhitelist")}
      description={"Управление проходками"}
      active={"whitelist"}
      navAccess={navAccess}
    >
      <WhitelistTable isAdmin={true} />
    </AdminPageShell>
  );
}