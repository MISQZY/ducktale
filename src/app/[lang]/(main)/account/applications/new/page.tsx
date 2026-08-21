import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { PanelCenteredShell } from "@/components/common/PanelCenteredShell";
import { NewApplicationForm } from "@/components/applications/NewApplicationForm";
import { SERVERS } from "@/config/servers";
import { getServerWhitelistStatuses } from "@/lib/players";

export default async function NewApplicationPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(`/${lang}/account/login`);

  const t = await getTranslations("Applications");

  // Only servers with whitelist mode currently on accept new applications —
  // same source as the /whitelist page (getServerWhitelistStatuses keys by
  // uuid, not the short id SERVERS.id/Application.serverId use).
  const whitelistStatuses = await getServerWhitelistStatuses().catch((err) => {
    console.error("[applications/new] Failed to load server whitelist statuses:", err);
    return new Set<string>();
  });
  const servers = SERVERS
    .filter((s) => whitelistStatuses.has(s.uuid))
    .map((s) => ({ id: s.id, name: s.name }));

  return (
    <PanelCenteredShell title={t("newApplicationTitle")} description={t("newApplicationDescription")}>
      <NewApplicationForm lang={lang} servers={servers} />
    </PanelCenteredShell>
  );
}
