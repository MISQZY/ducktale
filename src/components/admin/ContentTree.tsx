"use client";

import * as React from "react";
import { Settings2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { CONTENT_LOCALES, metaSlugFor, type ServerContentTree, type ContentTreeNode } from "@/lib/content-tree";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Selected {
  server: string;
  slug: string;
}

interface ContentTreeProps {
  trees: ServerContentTree[];
  selected: Selected | null;
  onSelect: (server: string, slug: string) => void;
}

export function ContentTree({ trees, selected, onSelect }: ContentTreeProps) {
  return (
    <div className="space-y-5">
      {trees.map((tree) => (
        <RootNode key={tree.server} tree={tree} selected={selected} onSelect={onSelect} />
      ))}
    </div>
  );
}

function RootNode({
  tree, selected, onSelect
}: {
  tree: ServerContentTree;
  selected: Selected | null;
  onSelect: (server: string, slug: string) => void;
}) {
  const [open, setOpen] = React.useState(true);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <MetaHeader
        label={tree.server}
        active={selected?.server === tree.server && selected?.slug === metaSlugFor("")}
        onClick={() => onSelect(tree.server, metaSlugFor(""))}
        className="mb-2"
        hasChildren={true}
        isOpen={open}
      />
      <CollapsibleContent>
        <TreeNodes nodes={tree.root} server={tree.server} selected={selected} onSelect={onSelect} depth={1} />
      </CollapsibleContent>
    </Collapsible>
  );
}

/** Server/folder name — clicking it opens that level's meta.json (page order + visibility), not a .mdx page. */
const MetaHeader = React.forwardRef<
  HTMLDivElement,
  {
    label: string;
    active: boolean;
    onClick?: () => void;
    depth?: number;
    className?: string;
    hasChildren?: boolean;
    isOpen?: boolean;
  } & React.ComponentPropsWithoutRef<"div">
>(({ label, active, onClick, depth = 0, className, hasChildren, isOpen, ...props }, ref) => {
  return (
    <div
      ref={ref}
      style={{ paddingLeft: depth * 14 + 8 }}
      className={cn(
        "w-full flex items-center pr-2 py-1 text-[11px] uppercase tracking-wide transition-colors rounded group relative z-10",
        active ? "bg-primary/10 text-primary/80" : "text-foreground/40 hover:text-foreground/70 hover:bg-primary/5",
        className
      )}
      title="meta.json — порядок и видимость страниц"
      {...props}
    >
      {hasChildren ? (
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="p-1 -ml-1 mr-0.5 rounded hover:bg-primary/20 shrink-0 transition-colors"
          >
            <ChevronRight
              size={12}
              className={cn("transition-transform opacity-60", isOpen ? "rotate-90" : "")}
            />
          </button>
        </CollapsibleTrigger>
      ) : (
        <Settings2 size={11} className="shrink-0 opacity-60 mr-1.5" />
      )}
      
      <button 
        type="button" 
        onClick={onClick}
        className="flex-1 text-left truncate flex items-center h-full outline-none"
      >
        <span className={cn("truncate", depth === 0 && "font-bold")}>{label}</span>
      </button>
    </div>
  );
});
MetaHeader.displayName = "MetaHeader";

function FolderNode({
  node, server, selected, onSelect, depth,
}: {
  node: import("@/lib/content-tree").ContentTreeFolderNode;
  server: string;
  selected: Selected | null;
  onSelect: (server: string, slug: string) => void;
  depth: number;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <MetaHeader
        label={node.name}
        active={selected?.server === server && selected?.slug === metaSlugFor(node.path)}
        onClick={() => onSelect(server, metaSlugFor(node.path))}
        depth={depth}
        hasChildren={true}
        isOpen={open}
      />
      <CollapsibleContent>
        <TreeNodes nodes={node.children} server={server} selected={selected} onSelect={onSelect} depth={depth + 1} />
      </CollapsibleContent>
    </Collapsible>
  );
}

function TreeNodes({
  nodes, server, selected, onSelect, depth,
}: {
  nodes: ContentTreeNode[];
  server: string;
  selected: Selected | null;
  onSelect: (server: string, slug: string) => void;
  depth: number;
}) {
  return (
    <ul className="space-y-0.5 relative">
      {depth > 0 && (
        <div 
          className="absolute top-0 bottom-0 w-[1px] bg-primary/10 z-0 pointer-events-none"
          style={{ left: `${(depth - 1) * 14 + 14}px` }} 
        />
      )}
      {nodes.map((node) => (
        <li key={node.type === "folder" ? node.path : node.slug} className="relative z-10">
          {node.type === "folder" ? (
            <FolderNode node={node} server={server} selected={selected} onSelect={onSelect} depth={depth} />
          ) : (
            <button
              type="button"
              onClick={() => onSelect(server, node.slug)}
              style={{ paddingLeft: depth * 14 + 26 }}
              className={cn(
                "w-full text-left pr-2 py-1.5 rounded-lg text-sm truncate transition-colors flex items-center gap-2 outline-none",
                selected?.server === server && selected?.slug === node.slug
                  ? "bg-primary/10 text-primary/90"
                  : "text-foreground/70 hover:bg-primary/5 hover:text-foreground/90"
              )}
            >
              <span className="truncate">{node.name}</span>
              <span className="ml-auto flex gap-1 shrink-0">
                {CONTENT_LOCALES.map((loc) => (
                  <span
                    key={loc}
                    className={cn(
                      "text-[9px] uppercase",
                      node.locales.includes(loc) ? "text-primary/50" : "text-foreground/15"
                    )}
                  >
                    {loc}
                  </span>
                ))}
              </span>
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
