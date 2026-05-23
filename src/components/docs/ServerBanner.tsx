import type { ServerConfig } from "@/config/servers";
import ServerStatusBadge from "@/components/ServerStatusBadge";
import { cn } from "@/lib/utils";

interface ServerBannerProps {
  config: ServerConfig;
}

export function ServerBanner({ config }: ServerBannerProps) {
  return (
    <div className={cn(
      "rounded-xl border p-3.5 relative bg-linear-to-br",
      config.border, config.color
    )}>
      <div className="absolute -top-px -left-px w-4 h-4 border-t-2 border-l-2 border-gold-400/60 rounded-tl-xl pointer-events-none" />
      <div className="absolute -bottom-px -right-px w-4 h-4 border-b-2 border-r-2 border-gold-400/60 rounded-br-xl pointer-events-none" />

      <div className="absolute top-0 left-4 right-4 h-px bg-linear-to-r from-transparent via-current to-transparent opacity-20" />

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl leading-none">{config.emoji}</span>
          <div>
            <p className="font-bold text-amber-100 leading-none text-sm"
              style={{ fontFamily: "var(--font-display)" }}>{config.name}</p>
            <span className={cn("text-xs px-1.5 py-0.5 rounded-full mt-1.5 inline-block", config.badge)}>
              {config.tagline}
            </span>
          </div>
        </div>
        <ServerStatusBadge host={config.host} />
      </div>
    </div>
  );
}
