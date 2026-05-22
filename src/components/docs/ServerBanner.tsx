import type { ServerConfig } from "@/config/servers";
import ServerStatusBadge from "@/components/ServerStatusBadge";
import { cn } from "@/lib/utils";

interface ServerBannerProps {
  config: ServerConfig;
}

export function ServerBanner({ config }: ServerBannerProps) {
  return (
    <div className={cn("rounded-xl border p-3 relative bg-linear-to-br", config.border, config.color)}>
      <div className="absolute top-0 left-4 right-4 h-px bg-linear-to-r from-transparent via-current to-transparent opacity-20" />
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xl leading-none">{config.emoji}</span>
          <div>
            <p className="font-bold text-amber-100 leading-none">{config.name}</p>
            <span className={cn("text-xs px-1.5 py-0.5 rounded-full mt-1 inline-block", config.badge)}>
              {config.tagline}
            </span>
          </div>
        </div>
        <ServerStatusBadge host={config.host} />
      </div>
    </div>
  );
}
