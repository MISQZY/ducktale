"use client";

import { type ServerContentTree } from "@/lib/content-tree";
import { ContentWorkspaceSidebar } from "./content-workspace/ContentWorkspaceSidebar";
import { ContentWorkspaceEditor } from "./content-workspace/ContentWorkspaceEditor";

interface ContentWorkspaceProps {
  lang: string;
  trees: ServerContentTree[];
}

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

export function ContentWorkspace({ lang, trees }: ContentWorkspaceProps) {
  return (
    <div className="w-full" style={{ height: "calc(100vh - 380px)", minHeight: "500px" }}>
      <ResizablePanelGroup
        orientation="horizontal"
        className="h-full w-full"
      >
        <ResizablePanel defaultSize="20" minSize="15" maxSize="40">
          <ContentWorkspaceSidebar trees={trees} />
        </ResizablePanel>

        <ResizableHandle withHandle className="w-[2px] mx-2 rounded-full bg-primary/10 hover:bg-primary/30 transition-colors" />

        <ResizablePanel defaultSize="80" minSize="40">
          <ContentWorkspaceEditor lang={lang} trees={trees} />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
