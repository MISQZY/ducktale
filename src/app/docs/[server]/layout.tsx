import { DocsLayout } from "fumadocs-ui/layouts/docs";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { SERVERS } from "@/config/servers";
import { getDocsSource } from "@/lib/source";
import Logo from "@/components/ui/Logo";
import { ServerBanner } from "@/components/docs/ServerBanner";

export default async function DocsServerLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ server: string }>;
}) {
  const { server } = await params;
  const config = SERVERS.find((s) => s.id === server);
  if (!config) notFound();

  const source = getDocsSource(server);

  return (
    <DocsLayout
      tree={source.pageTree}
      themeSwitch={{ enabled: false }}
      nav={{ title: <Logo /> }}
      sidebar={{
        banner: <ServerBanner config={config} />,
      }}
    >
      {children}
    </DocsLayout>
  );
}