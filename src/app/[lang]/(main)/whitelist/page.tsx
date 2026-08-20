import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { requirePublicResourceRole } from "@/lib/public-access";
import { SERVERS } from "@/config/servers";
import { WhitelistBrowser } from "@/components/whitelist/WhitelistBrowser";
import { getServerWhitelistStatuses } from "@/lib/players";

export default async function WhitelistPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  await requirePublicResourceRole(lang, "whitelist-page-view");

  const whitelistStatuses = await getServerWhitelistStatuses().catch((err) => {
    console.error("[whitelist-page] Failed to load server whitelist statuses:", err);
    return new Set<string>();
  });

  const servers = SERVERS
    .filter((s) => whitelistStatuses.has(s.uuid))
    .map((s) => ({
      id: s.uuid, // Use uuid because Whitelist API expects uuid
      host: s.host,
      name: s.name,
      emoji: s.emoji,
    }));

  return (
    <main className="relative overflow-hidden h-dvh flex flex-col px-6 pt-24 pb-8">
      <div className="relative z-10 w-full flex-1 min-h-0">
        <WhitelistBrowser servers={servers} />
      </div>
    </main>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Nav");
  return { title: t("whitelist") };
}