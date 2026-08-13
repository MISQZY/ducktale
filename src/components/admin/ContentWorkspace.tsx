"use client";

import { type ServerContentTree } from "@/lib/content-tree";
import { ContentWorkspaceSidebar } from "./content-workspace/ContentWorkspaceSidebar";
import { ContentWorkspaceEditor } from "./content-workspace/ContentWorkspaceEditor";

interface ContentWorkspaceProps {
  lang: string;
  trees: ServerContentTree[];
}

export function ContentWorkspace({ lang, trees }: ContentWorkspaceProps) {
  return (
    <div className="flex flex-row gap-6 items-start">
      <ContentWorkspaceSidebar trees={trees} />
      <ContentWorkspaceEditor lang={lang} trees={trees} />
    </div>
  );
}
