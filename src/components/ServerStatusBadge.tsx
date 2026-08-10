"use client";

import { useTranslations } from "next-intl";
import { useServerStatus } from "@/hooks/useServerStatus";
import { cn } from "@/lib/utils";

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

  return (
    <div className="flex flex-col items-start gap-0.5 text-xs">
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

      {status.online && status.players && (
        <div className="relative group/players text-foreground/50 cursor-default">
          <span>
            {t("players", { count: `${status.players.online}/${status.players.max}` })}
          </span>
          {status.players.list && status.players.list.length > 0 && (
            <div className="absolute left-0 top-full mt-1 z-10 hidden group-hover/players:block bg-popover border border-border rounded px-2 py-1.5 min-w-max shadow-md">
              {status.players.list.map((p) => (
                <div key={p.name} className="text-popover-foreground/80">{p.name}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {status.version && (
        <div className="text-foreground/40">{status.version}</div>
      )}
    </div>
  );
}
