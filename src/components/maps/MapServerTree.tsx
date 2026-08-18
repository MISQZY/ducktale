"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { localizedName, type LocalizedName } from "@/lib/i18n-name";

export interface MapTreeEntry {
  id: string;
  name: LocalizedName;
}

export interface MapTreeServer {
  id: string;
  name: string;
  emoji: string;
  maps: MapTreeEntry[];
}

interface MapServerTreeProps {
  lang: string;
  servers: MapTreeServer[];
  noMapsLabel: string;
}

function ServerNode({ lang, server, activeMapId, noMapsLabel }: { lang: string; server: MapTreeServer; activeMapId: string | undefined; noMapsLabel: string }) {
  // Open by default whenever one of this server's own maps is the active
  // route — otherwise collapsed, same "only expand what's relevant" default
  // ContentTree's folder nodes use.
  const [open, setOpen] = useState(() => server.maps.some((m) => m.id === activeMapId));

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="w-full flex items-center gap-1.5 pr-2 py-1.5 rounded-lg text-sm font-medium text-foreground/80 hover:bg-primary/5 transition-colors"
        >
          <ChevronRight size={13} className={cn("shrink-0 opacity-60 transition-transform", open && "rotate-90")} />
          <span className="text-base shrink-0" aria-hidden="true">{server.emoji}</span>
          <span className="truncate">{server.name}</span>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        {server.maps.length === 0 ? (
          <p className="pl-7 py-1 text-[0.7rem] text-foreground/30 italic">{noMapsLabel}</p>
        ) : (
          <ul className="space-y-0.5 pl-4">
            {server.maps.map((map) => (
              <li key={map.id}>
                <Link
                  href={`/maps/${server.id}/${map.id}`}
                  className={cn(
                    "block w-full text-left px-2.5 py-1.5 rounded-lg text-sm truncate transition-colors",
                    activeMapId === map.id
                      ? "bg-primary/10 text-primary/90"
                      : "text-foreground/70 hover:bg-primary/5 hover:text-foreground/90"
                  )}
                >
                  {localizedName(map.name, lang)}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

/** Left sidebar of /maps — one collapsible node per public server (SERVERS, src/config/servers.ts), each expanding into its own named maps (ServerMap rows), same nested shape as the admin ContentTree but read-only/navigation-only. */
export function MapServerTree({ lang, servers, noMapsLabel }: MapServerTreeProps) {
  const pathname = usePathname();
  const activeMapId = pathname.match(/^\/maps\/[^/]+\/([^/]+)$/)?.[1];

  return (
    <aside suppressHydrationWarning className="liquid-card w-full h-full flex flex-col min-w-0 overflow-hidden overflow-y-auto custom-scrollbar rounded-2xl border border-primary/20 bg-card/50 p-3">
      <div className="space-y-1">
        {servers.map((server) => (
          <ServerNode key={server.id} lang={lang} server={server} activeMapId={activeMapId} noMapsLabel={noMapsLabel} />
        ))}
      </div>
    </aside>
  );
}
