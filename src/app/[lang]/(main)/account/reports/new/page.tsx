import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { AccountShell } from "@/components/common/AccountShell";
import { NewReportForm } from "@/components/reports/NewReportForm";

export default async function NewReportPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(`/${lang}/account/login`);

  const t = await getTranslations("Reports");

  return (
    <AccountShell title={t("newReportTitle")} description={t("newReportDescription")}>
      <NewReportForm lang={lang} />
    </AccountShell>
  );
}
