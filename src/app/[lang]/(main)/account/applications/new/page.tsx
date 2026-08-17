import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { AccountShell } from "@/components/common/AccountShell";
import { NewApplicationForm } from "@/components/applications/NewApplicationForm";

export default async function NewApplicationPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(`/${lang}/account/login`);

  const t = await getTranslations("Applications");

  return (
    <AccountShell title={t("newApplicationTitle")} description={t("newApplicationDescription")}>
      <NewApplicationForm lang={lang} />
    </AccountShell>
  );
}
