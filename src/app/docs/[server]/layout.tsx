import { DocsLayout } from "fumadocs-ui/layouts/docs";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { SERVERS } from "@/config/servers";
import { getDocsSource } from "@/lib/source";
import Logo from "@/components/ui/Logo";

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
  const { sidebarBorderColor, sidebarBgColor, sidebarTextColor } = config.docs;

  return (
    <DocsLayout
      tree={source.pageTree}
      themeSwitch={{ enabled: false }}
      nav={{ title: <Logo /> }}
      sidebar={{
        banner: (
          <div className={`rounded-lg border ${sidebarBorderColor} ${sidebarBgColor} p-3 text-center`}>
            <p className={`text-lg font-bold ${sidebarTextColor}`}>{config.name}</p>
          </div>
        ),
      }}
    >
      {children}
    </DocsLayout>
  );
}