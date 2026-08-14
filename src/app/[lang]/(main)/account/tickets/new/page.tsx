import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { AccountShell } from "@/components/common/AccountShell";
import { NewTicketForm } from "@/components/tickets/NewTicketForm";

export default async function NewTicketPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(`/${lang}/account/login`);

  const t = await getTranslations("Tickets");

  return (
    <AccountShell title={t("newTicketTitle")} description={t("newTicketDescription")}>
      <NewTicketForm lang={lang} />
    </AccountShell>
  );
}
