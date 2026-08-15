import { DocsLayout } from "fumadocs-ui/layouts/docs";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { SERVERS } from "@/config/servers";
import { REPO } from "@/config/site";
import { getDocsSource } from "@/lib/source";
import Logo from "@/components/ui/Logo";
import { ServerSwitcher } from "@/components/docs/ServerSwitcher";

export default async function DocsServerLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ lang: string; server: string }>;
}) {
  const { lang, server } = await params;
  const fullConfig = SERVERS.find((s) => s.id === server);
  if (!fullConfig) notFound();
  // Server Components can't hand a Client Component a raw component
  // reference (ServerConfig.icon), only plain data — ServerSwitcher never
  // reads .icon anyway, so it's dropped here rather than in the config.
  const { icon: _icon, ...config } = fullConfig;

  const source = getDocsSource(server);
  if (!source) notFound();

  const tree = source.pageTree[lang];
  if (!tree) notFound();

  return (
    <DocsLayout
      tree={tree}
      nav={{ title: <Logo key="logo" /> }}
      githubUrl={REPO.url}
      sidebar={{
        banner: <ServerSwitcher key="server-switcher" current={config} />,
      }}
    >
      {children}
    </DocsLayout>
  );
}
