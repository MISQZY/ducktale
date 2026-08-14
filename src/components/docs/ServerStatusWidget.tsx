"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  DuckCard,
  DuckCardContent,
  DuckCardHeader,
  DuckCardTitle,
} from "@/components/ui/duck/card";
import { DuckBadge } from "@/components/ui/duck/badge";
import { DuckSeparator } from "@/components/ui/duck/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, Users, Settings } from "lucide-react";
import { useServerStatus } from "@/hooks/useServerStatus";

interface ServerStatusWidgetProps {
  host: string;
  serverName?: string;
  className?: string;
}

/**
 * ServerStatusWidget — full card with player list, version and collapsible roster.
 *
 * Usage in MDX:
 * ```mdx
 * <ServerStatusWidget host="s6.yufu.su:25582" serverName="DuckBurg" />
 * ```
 */
export function ServerStatusWidget({ host, serverName, className }: ServerStatusWidgetProps) {
  const t = useTranslations("Servers.status");
  const result = useServerStatus(host);

  if (result.state === "loading") {
    return (
      <DuckCard className={cn("border-amber-900/20 bg-duck-stone/30 animate-pulse", className)}>
        <DuckCardHeader className="py-3">
          <div className="h-4 w-32 rounded bg-primary/20" />
        </DuckCardHeader>
        <DuckCardContent>
          <div className="h-3 w-20 rounded bg-primary/20" />
        </DuckCardContent>
      </DuckCard>
    );
  }

  if (result.state === "error") {
    return (
      <DuckCard className={cn("border-red-900/20 bg-duck-stone/30", className)}>
        <DuckCardContent className="py-3">
          <p className="text-xs text-red-600/70 dark:text-red-400/70">
            {t("unavailableHint")}
          </p>
        </DuckCardContent>
      </DuckCard>
    );
  }

  const { status } = result;
  const playerList = status.players?.list ?? [];
  const hasPlayers = status.online && (status.players?.online ?? 0) > 0 && playerList.length > 0;

  return (
    <DuckCard className={cn("border-amber-900/20 bg-duck-stone/30 my-4 transition-colors duration-300", status.maintenance && "animate-border-glow", className)}>
      <DuckCardHeader className="py-3 pb-2">
        <div className="flex items-center justify-between">
          <DuckCardTitle className="text-sm text-foreground/80 font-medium flex items-center gap-2">
            {serverName ?? host}
            {status.maintenance && (
              <span className="text-yellow-500/80" title="Maintenance Mode">
                <Settings size={14} className="animate-[spin_4s_linear_infinite]" />
              </span>
            )}
          </DuckCardTitle>
          <DuckBadge
            variant="outline"
            className={cn(
              "gap-1.5 text-xs",
              status.online
                ? "border-green-700/40 bg-green-950/30 text-green-700 dark:text-green-300"
                : "border-red-700/40 bg-red-950/30 text-red-700 dark:text-red-300"
            )}
          >
            <span
              className={cn(
                "inline-block w-1.5 h-1.5 rounded-full",
                status.online ? "bg-green-400 animate-pulse" : "bg-red-400"
              )}
            />
            {status.online ? t("online") : t("offline")}
          </DuckBadge>
        </div>
      </DuckCardHeader>

      <DuckCardContent className="pt-0 space-y-2">
        {status.online ? (
          <>
            <div className="flex items-center gap-4 text-xs text-foreground/50">
              {status.players && (
                <span className="flex items-center gap-1.5">
                  <Users size={11} />
                  {t("players", { count: `${status.players.online}/${status.players.max}` })}
                </span>
              )}
              {status.version && (
                <span className="font-mono">{status.version}</span>
              )}
            </div>

            {hasPlayers && (
              <>
                <DuckSeparator className="bg-primary/20" />
                <Collapsible>
                  <CollapsibleTrigger className="flex items-center gap-1 text-xs text-foreground/40 hover:text-foreground/60 transition-colors group">
                    {t("playerList")}
                    <ChevronDown
                      size={12}
                      className="transition-transform group-data-[state=open]:rotate-180"
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {playerList.map((p) => (
                        <DuckBadge
                          key={p.name}
                          variant="secondary"
                          className="text-xs bg-muted text-foreground/60 border border-primary/15"
                        >
                          {p.name}
                        </DuckBadge>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </>
            )}
          </>
        ) : (
          <p className="text-xs text-foreground/30">
            {t("offlineHint")}
          </p>
        )}
      </DuckCardContent>
    </DuckCard>
  );
}
