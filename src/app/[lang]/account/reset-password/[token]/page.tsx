import { getTranslations } from "next-intl/server";
import { AccountShell } from "@/components/common/AccountShell";
import { ResetPasswordForm } from "@/components/account/ResetPasswordForm";
import { Link } from "@/i18n/navigation";
import { siteDb } from "@/lib/site-db";
import { isUsableResetToken } from "@/lib/password-reset";

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ lang: string; token: string }>;
}) {
  const { token } = await params;
  const t = await getTranslations("Account.resetPassword");

  const reset = await siteDb.passwordResetToken.findUnique({
    where: { token },
    select: { expiresAt: true, usedAt: true, user: { select: { nickname: true } } },
  });

  if (!reset || !isUsableResetToken(reset)) {
    return (
      <AccountShell title={t("invalidTitle")} description={t("invalidDescription")}>
        <Link
          href="/account/login"
          className="block text-center text-sm text-primary/80 hover:text-primary"
        >
          {t("backToLogin")}
        </Link>
      </AccountShell>
    );
  }

  return (
    <AccountShell title={t("title")} description={t("description")}>
      <ResetPasswordForm token={token} nickname={reset.user.nickname} />
    </AccountShell>
  );
}
