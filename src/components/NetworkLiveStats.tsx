"use client";

import { useServerStatuses } from "@/context/ServerStatusContext";
import { SERVERS } from "@/config/servers";
import { cn } from "@/lib/utils";

export function NetworkLiveStats({ className }: { className?: string }) {
  const { statuses, loading } = useServerStatuses();

  const servers = SERVERS.map((s) => ({
    ...s,
    status: statuses[s.host],
  }));

  const totalOnline = servers.reduce(
    (acc, s) => acc + (s.status?.players?.online ?? 0),
    0
  );
  const anyOnline = servers.some((s) => s.status?.online);

  return (
    <div
      className={cn(
        "inline-flex items-center gap-3 rounded-full px-4 py-1.5",
        "border border-gold-700/20 bg-stone-900/60 backdrop-blur-sm",
        "text-xs text-amber-100/50",
        className
      )}
      style={{ fontFamily: "var(--font-mono)" }}
    >
      <span className="flex items-center gap-1.5">
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full",
            loading
              ? "bg-amber-600/30 animate-pulse"
              : anyOnline
              ? "bg-green-400 animate-pulse"
              : "bg-red-400/60"
          )}
        />
        {loading ? (
          <span className="text-amber-100/25">...</span>
        ) : (
          <span>
            <span className="text-amber-100/80 font-semibold tabular-nums">
              {totalOnline}
            </span>{" "}
            в сети
          </span>
        )}
      </span>

      <span className="text-gold-700/40">·</span>

      {servers.map((s, i) => (
        <span key={s.id} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-gold-700/30">·</span>}
          <span className="text-amber-100/30">{s.emoji}</span>
          {loading ? (
            <span className="text-amber-100/20">—</span>
          ) : s.status?.online ? (
            <span className="text-amber-100/60 tabular-nums">
              {s.status.players?.online ?? 0}
            </span>
          ) : (
            <span className="text-red-400/50">офлайн</span>
          )}
        </span>
      ))}
    </div>
  );
}