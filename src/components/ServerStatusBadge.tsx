"use client";

import { useServerStatus } from "@/hooks/useServerStatus";
import { cn } from "@/lib/utils";

export default function ServerStatusBadge({ host }: { host: string }) {
  const result = useServerStatus(host);

  if (result.state === "loading") {
    return (
      <div className="flex flex-col items-end gap-0.5 text-xs text-amber-100/30 animate-pulse">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-100/20" />
          <span>Загрузка...</span>
        </div>
      </div>
    );
  }

  if (result.state === "error") {
    return (
      <div className="flex items-center gap-1.5 text-xs text-red-400/60">
        <span className="w-1.5 h-1.5 rounded-full bg-red-400/60" />
        <span>Недоступно</span>
      </div>
    );
  }

  const { status } = result;

  return (
    <div className="flex flex-col items-end gap-0.5 text-xs">
      <div className={cn(
        "flex items-center gap-1.5",
        status.online ? "text-green-400" : "text-red-400"
      )}>
        <span className={cn(
          "w-1.5 h-1.5 rounded-full",
          status.online ? "bg-green-400 animate-pulse" : "bg-red-400"
        )} />
        {status.online ? "Онлайн" : "Офлайн"}
      </div>

      {status.online && status.players && (
        <div className="relative group/players text-amber-100/40 cursor-default">
          <span>
            {status.players.online}/{status.players.max} игроков
          </span>
          {status.players.list && status.players.list.length > 0 && (
            <div className="absolute right-0 top-full mt-1 z-10 hidden group-hover/players:block bg-stone-900 border border-amber-100/10 rounded px-2 py-1.5 min-w-max">
              {status.players.list.map((p) => (
                <div key={p.name} className="text-amber-100/70">{p.name}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {status.version && (
        <div className="text-amber-100/30">{status.version}</div>
      )}
    </div>
  );
}
