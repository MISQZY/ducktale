"use client";

import { useEffect, useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { WhitelistTable } from "@/components/whitelist/WhitelistTable";
import { cn } from "@/lib/utils";
import { useServerStatuses } from "@/context/ServerStatusContext";

export function WhitelistServerList({ servers, activeServerId, onSelect }: { servers: { id: string, name: string, emoji: string, host: string }[], activeServerId: string, onSelect: (id: string) => void }) {
  return (
    <aside className="liquid-card w-full h-full flex flex-col min-w-0 overflow-hidden rounded-2xl border border-primary/20 bg-card/50 p-4">
      <div className="flex-1 min-h-0 overflow-y-auto pr-2 custom-scrollbar">
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => onSelect("")}
            className={cn(
              "w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm transition-colors text-left",
              activeServerId === ""
                ? "bg-primary/10 text-primary/90 font-medium"
                : "text-foreground/70 hover:bg-primary/5 hover:text-foreground/90"
            )}
          >
            <span className="text-base shrink-0" aria-hidden="true">🌍</span>
            <span className="truncate">Все серверы</span>
          </button>
          
          <div className="h-px bg-primary/10 shrink-0 my-2" />

          {servers.map((server) => (
            <button
              key={server.id}
              type="button"
              onClick={() => onSelect(server.id)}
              className={cn(
                "w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm transition-colors text-left",
                activeServerId === server.id
                  ? "bg-primary/10 text-primary/90 font-medium"
                  : "text-foreground/70 hover:bg-primary/5 hover:text-foreground/90"
              )}
            >
              <span className="text-base shrink-0" aria-hidden="true">{server.emoji}</span>
              <span className="truncate">{server.name}</span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}

export function WhitelistBrowser({ servers }: { servers: { id: string, name: string, emoji: string, host: string }[] }) {
  const [serverId, setServerId] = useState<string>("");

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("server");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (fromUrl) setServerId(fromUrl);
  }, []);

  const handleSelect = (id: string) => {
    setServerId(id);
    const url = new URL(window.location.href);
    if (id) url.searchParams.set("server", id);
    else url.searchParams.delete("server");
    window.history.replaceState(null, "", "?" + url.searchParams.toString());
  };

  return (
    <ResizablePanelGroup id="whitelist-layout" key="panels-v2" orientation="horizontal" className="h-full w-full">
      <ResizablePanel id="whitelist-sidebar" defaultSize="15" minSize="10" maxSize="30">
        <WhitelistServerList servers={servers} activeServerId={serverId} onSelect={handleSelect} />
      </ResizablePanel>

      <ResizableHandle withHandle className="w-[2px] mx-2 rounded-full bg-primary/10 hover:bg-primary/30 transition-colors" />

      <ResizablePanel id="whitelist-content" defaultSize="85" minSize="60">
        <div suppressHydrationWarning className="liquid-card w-full h-full flex flex-col min-w-0 overflow-hidden rounded-2xl border border-primary/20 bg-card/50 p-4 sm:p-6">
          <WhitelistTable serverId={serverId} className="h-full min-w-0 overflow-hidden" />
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}