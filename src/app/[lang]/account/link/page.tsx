import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { siteDb } from "@/lib/site-db";
import { requestNewLinkCode, isUsablePendingCode } from "@/lib/account-link";
import { AccountShell } from "@/components/common/AccountShell";
import { LinkAccountFlow } from "@/components/account/LinkAccountFlow";

export default async function LinkAccountPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(`/${lang}/account/login`);

  const t = await getTranslations("Account.link");
  const existing = await siteDb.accountLink.findUnique({
    where: { userId: session.user.id },
    select: { status: true, code: true, minecraftName: true, expiresAt: true },
  });

  // No extra "get code" click for the common case: a fresh code is ready
  // server-side before this page ever renders, unless there's already a
  // valid one in flight (don't invalidate a code the player might be
  // mid-typing in-game) or the account is already linked (shows that
  // state instead — relinking is still one explicit click away).
  const link =
    existing && (existing.status === "CONFIRMED" || isUsablePendingCode(existing))
      ? existing
      : await requestNewLinkCode(session.user.id);

  return (
    <AccountShell title={t("title")} description={t("description")}>
      <LinkAccountFlow
        lang={lang}
        initialLink={{
          status: link.status,
          code: link.code,
          minecraftName: link.minecraftName,
          expiresAt: link.expiresAt.toISOString(),
        }}
      />
    </AccountShell>
  );
}
