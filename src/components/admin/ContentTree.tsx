"use client";

import { Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { CONTENT_LOCALES, metaSlugFor, type ServerContentTree, type ContentTreeNode } from "@/lib/content-tree";

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
        <div key={tree.server}>
          <MetaHeader
            label={tree.server}
            active={selected?.server === tree.server && selected?.slug === metaSlugFor("")}
            onClick={() => onSelect(tree.server, metaSlugFor(""))}
            className="mb-2"
          />
          <TreeNodes nodes={tree.root} server={tree.server} selected={selected} onSelect={onSelect} depth={0} />
        </div>
      ))}
    </div>
  );
}

/** Server/folder name — clicking it opens that level's meta.json (page order + visibility), not a .mdx page. */
function MetaHeader({
  label, active, onClick, depth = 0, className,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  depth?: number;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ paddingLeft: depth * 14 + 8 }}
      className={cn(
        "w-full flex items-center gap-1.5 pr-2 py-1 text-[11px] uppercase tracking-wide transition-colors rounded",
        active ? "bg-primary/10 text-primary/80" : "text-foreground/40 hover:text-foreground/70 hover:bg-primary/5",
        className
      )}
      title="meta.json — порядок и видимость страниц"
    >
      <Settings2 size={11} className="shrink-0 opacity-60" />
      <span className="truncate">{label}</span>
    </button>
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
    <ul className="space-y-0.5">
      {nodes.map((node) => (
        <li key={node.type === "folder" ? node.path : node.slug}>
          {node.type === "folder" ? (
            <>
              <MetaHeader
                label={node.name}
                active={selected?.server === server && selected?.slug === metaSlugFor(node.path)}
                onClick={() => onSelect(server, metaSlugFor(node.path))}
                depth={depth}
              />
              <TreeNodes nodes={node.children} server={server} selected={selected} onSelect={onSelect} depth={depth + 1} />
            </>
          ) : (
            <button
              type="button"
              onClick={() => onSelect(server, node.slug)}
              style={{ paddingLeft: depth * 14 + 8 }}
              className={cn(
                "w-full text-left pr-2 py-1.5 rounded-lg text-sm truncate transition-colors flex items-center gap-2",
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
