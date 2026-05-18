import { DocsLayout } from "fumadocs-ui/layouts/docs";
import type { ReactNode } from "react";
import { duckburgSource } from "@/lib/source";

export default function DuckBurgDocsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <DocsLayout
      tree={duckburgSource.pageTree}
      nav={{
        title: (
          <span className="flex items-center gap-2 font-bold text-amber-400">
            <span>⚔️</span>
            <span>DuckBurg</span>
          </span>
        ),
      }}
      sidebar={{
        banner: (
          <div className="rounded-lg border border-green-700/30 bg-green-950/30 p-3 text-center">
            <p className="text-xs text-green-400 font-medium">DuckBurg</p>
            <p className="text-xs text-green-100/50 mt-0.5">s6.yufu.su:25569</p>
          </div>
        ),
      }}
    >
      {children}
    </DocsLayout>
  );
}
