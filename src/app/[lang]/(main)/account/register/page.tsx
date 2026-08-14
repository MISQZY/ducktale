import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { AccountShell } from "@/components/common/AccountShell";
import { RegisterForm } from "@/components/account/RegisterForm";

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const session = await auth();
  if (session?.user?.id) redirect(`/${lang}/profile`);

  const t = await getTranslations("Account.register");

  return (
    <AccountShell title={t("title")} description={t("description")}>
      <RegisterForm />
    </AccountShell>
  );
}
