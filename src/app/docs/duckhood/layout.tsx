import { DocsLayout } from "fumadocs-ui/layouts/docs";
import type { ReactNode } from "react";
import { duckhoodSource } from "@/lib/source";
import Logo from "@/components/ui/Logo"


export default function DuckHoodDocsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <DocsLayout
      tree={duckhoodSource.pageTree}
      themeSwitch={{ enabled: false }}
      nav={{
        title: (
          <Logo/>
        ),
      }}
      sidebar={{
        banner: (
          <div className="rounded-lg border border-sky-700/30 bg-sky-950/30 p-3 text-center">
            <p className="text-lg text-sky-400 font-bold">DuckHood</p>
          </div>
        ),
      }}
    >
      {children}
    </DocsLayout>
  );
}
