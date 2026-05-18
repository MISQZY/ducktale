import { DocsLayout } from "fumadocs-ui/layouts/docs";
import type { ReactNode } from "react";
import { duckhoodSource } from "@/lib/source";

export default function DuckHoodDocsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <DocsLayout
      tree={duckhoodSource.pageTree}
      nav={{
        title: (
          <span className="flex items-center gap-2 font-bold text-sky-400">
            <span>🎨</span>
            <span>DuckHood</span>
          </span>
        ),
      }}
      sidebar={{
        banner: (
          <div className="rounded-lg border border-sky-700/30 bg-sky-950/30 p-3 text-center">
            <p className="text-xs text-sky-400 font-medium">DuckHood</p>
            <p className="text-xs text-amber-100/50 mt-0.5">s6.yufu.su:25569</p>
          </div>
        ),
      }}
    >
      {children}
    </DocsLayout>
  );
}
