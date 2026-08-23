"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { SERVERS } from "@/config/servers";

/** "all" / "site" / "server" (any server) / a specific SERVERS[].id. */
export type NewsFilterKey = "all" | "site" | "server" | string;

interface NewsSidebarProps {
  active: NewsFilterKey;
  onChange: (key: NewsFilterKey) => void;
  counts: Record<string, number>;
}

/**
 * Left sidebar of /news — same full-height "liquid-card" tree shape as
 * MapServerTree (src/components/maps/MapServerTree.tsx): a real left column
 * inside the page's ResizablePanelGroup (see news/page.tsx), not a column
 * stacked above the feed inside a centered max-width block.
 */
export function NewsSidebar({ active, onChange, counts }: NewsSidebarProps) {
  const t = useTranslations("News.sidebar");
  const [serversOpen, setServersOpen] = useState(active === "server" || SERVERS.some((s) => s.id === active));

  const itemClass = (isActive: boolean) =>
    cn(
      "flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-sm text-left transition-colors w-full",
      isActive ? "bg-primary/10 text-primary/90 font-medium" : "text-foreground/70 hover:bg-primary/5 hover:text-foreground/90"
    );

  const countBadge = (count: number | undefined) =>
    count ? <span className="font-mono text-[10px] tabular-nums opacity-50">{count}</span> : null;

  return (
    <aside suppressHydrationWarning className="liquid-card w-full h-full flex flex-col min-w-0 overflow-hidden overflow-y-auto custom-scrollbar rounded-2xl border border-primary/20 bg-card/50 p-3">
      <nav className="space-y-1" aria-label={t("all")}>
        <button onClick={() => onChange("all")} className={itemClass(active === "all")}>
          <span>{t("all")}</span>
          {countBadge(counts.all)}
        </button>
        <button onClick={() => onChange("site")} className={itemClass(active === "site")}>
          <span>{t("site")}</span>
          {countBadge(counts.site)}
        </button>

        <Collapsible open={serversOpen} onOpenChange={setServersOpen}>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="w-full flex items-center gap-1.5 pr-2 py-1.5 rounded-lg text-sm font-medium text-foreground/80 hover:bg-primary/5 transition-colors"
            >
              <ChevronRight size={13} className={cn("shrink-0 opacity-60 transition-transform", serversOpen && "rotate-90")} />
              {t("servers")}
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <ul className="space-y-0.5 pl-4">
              <li>
                <button onClick={() => onChange("server")} className={itemClass(active === "server")}>
                  <span>{t("allServers")}</span>
                  {countBadge(counts.server)}
                </button>
              </li>
              {SERVERS.map((server) => (
                <li key={server.id}>
                  <button onClick={() => onChange(server.id)} className={itemClass(active === server.id)}>
                    <span className="inline-flex items-center gap-1.5">
                      <span aria-hidden="true">{server.emoji}</span>
                      {server.name}
                    </span>
                    {countBadge(counts[server.id])}
                  </button>
                </li>
              ))}
            </ul>
          </CollapsibleContent>
        </Collapsible>
      </nav>
    </aside>
  );
}
