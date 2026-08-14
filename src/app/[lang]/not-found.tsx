import { useLocale, useTranslations } from "next-intl";
import { SERVERS } from "@/config/servers";
import Navbar from "@/components/Navbar";
import { NotFoundView } from "@/components/common/NotFoundView";
import { createMetadata } from "@/lib/create-metadata";

export const generateMetadata = createMetadata({ namespace: "NotFound" });

export default function NotFound() {
  const t = useTranslations("NotFound");
  const tServers = useTranslations("Servers");
  const locale = useLocale();

  // NotFoundView's links are plain next/link (it's shared with the
  // context-free app/global-not-found.tsx), so hrefs need the locale baked
  // in here rather than relying on next-intl's Link to add it.
  return (
    <>
      <Navbar />
      <NotFoundView
        badge={t("badge")}
        heading={t("heading")}
        description={t("description")}
        ctaHomeLabel={t("ctaHome")}
        ctaServersLabel={t("ctaServers")}
        docsHint={t("docsHint")}
        homeHref={`/${locale}`}
        serversHref={`/${locale}#servers`}
        servers={SERVERS.map((server) => ({
          id: server.id,
          emoji: server.emoji,
          name: server.name,
          tagline: tServers(`items.${server.id}.tagline`),
          href: `/${locale}${server.href}`,
        }))}
      />
    </>
  );
}
