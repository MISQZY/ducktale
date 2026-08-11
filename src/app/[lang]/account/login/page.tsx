import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { AccountShell } from "@/components/common/AccountShell";
import { LoginForm } from "@/components/account/LoginForm";

export default async function LoginPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const session = await auth();
  if (session?.user?.id) redirect(`/${lang}/profile`);

  const t = await getTranslations("Account.login");

  return (
    <AccountShell title={t("title")} description={t("description")}>
      <LoginForm />
    </AccountShell>
  );
}
