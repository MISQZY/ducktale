"use client";

import { useTranslations } from "next-intl";
import { useServerStatus } from "@/hooks/useServerStatus";
import { cn } from "@/lib/utils";
import {
  DuckHoverCard,
  DuckHoverCardTrigger,
  DuckHoverCardContent,
} from "@/components/ui/duck/hover-card";
import { SkinFace } from "@/components/common/SkinFace";
import { EXTERNAL_APIS } from "@/config/external-apis";

export default function ServerStatusBadge({ host }: { host: string }) {
  const t = useTranslations("Servers.status");
  const result = useServerStatus(host);

  if (result.state === "loading") {
    return (
      <div className="flex flex-col items-start gap-0.5 text-xs text-foreground/40 animate-pulse">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-foreground/20" />
          <span>{t("loading")}</span>
        </div>
      </div>
    );
  }

  if (result.state === "error") {
    return (
      <div className="flex items-center gap-1.5 text-xs text-destructive/60">
        <span className="w-1.5 h-1.5 rounded-full bg-destructive/60" />
        <span>{t("unavailable")}</span>
      </div>
    );
  }

  const { status } = result;

  // status.online is undefined (not false) when the viewer lacks
  // server-status-view — that role gates online/who's-playing visibility,
  // so only the version line below renders for them.
  return (
    <div className="flex flex-col items-start gap-0.5 text-xs">
      {status.online !== undefined && (
        <div className={cn(
          "flex items-center gap-1.5",
          status.online ? "text-emerald-400" : "text-destructive"
        )}>
          <span className={cn(
            "w-1.5 h-1.5 rounded-full",
            status.online ? "bg-emerald-400 animate-pulse" : "bg-destructive"
          )} />
          {status.online ? t("online") : t("offline")}
        </div>
      )}

      {status.online && status.players && (
        status.players.list && status.players.list.length > 0 ? (
          <DuckHoverCard openDelay={150}>
            <DuckHoverCardTrigger asChild>
              <span className="text-foreground/50 cursor-default">
                {t("players", { count: `${status.players.online}/${status.players.max}` })}
              </span>
            </DuckHoverCardTrigger>
            <DuckHoverCardContent align="start" className="w-auto min-w-32 p-2">
              <div className="max-h-[240px] overflow-y-auto custom-scrollbar space-y-1.5 pr-1">
                {status.players.list.map((p) => (
                  <div key={p.name} className="flex items-center gap-2 text-xs text-foreground/80">
                    <SkinFace
                      skinUrl={EXTERNAL_APIS.legacy_skin.skinUrl(p.name)}
                      size={16}
                      className="rounded-sm"
                    />
                    {p.name}
                  </div>
                ))}
              </div>
            </DuckHoverCardContent>
          </DuckHoverCard>
        ) : (
          <span className="text-foreground/50 cursor-default">
            {t("players", { count: `${status.players.online}/${status.players.max}` })}
          </span>
        )
      )}

      {status.version && (
        <div className="text-foreground/40">{status.version}</div>
      )}
    </div>
  );
}
