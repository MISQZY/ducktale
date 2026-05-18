import { DocsLayout } from "fumadocs-ui/layouts/docs";
import type { ReactNode } from "react";
import { duckburgSource } from "@/lib/source";
import Logo from "@/components/ui/Logo";

export default function DuckBurgDocsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <DocsLayout
      tree={duckburgSource.pageTree}
      themeSwitch={{ enabled: false }}
      nav={{
        title: (
          <Logo/>
        ),
      }}
      sidebar={{
        banner: (
          <div className="rounded-lg border border-green-700/30 bg-green-950/30 p-3 text-center">
            <p className="text-lg text-green-400 font-bold">DuckBurg</p>
          </div>
        ),
      }}
    >
      {children}
    </DocsLayout>
  );
}
