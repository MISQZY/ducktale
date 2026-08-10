import { ChevronDown } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { SERVERS, type ServerConfig } from "@/config/servers";
import ServerStatusBadge from "@/components/ServerStatusBadge";
import { cn } from "@/lib/utils";

interface ServerSwitcherProps {
  current: ServerConfig;
}

/**
 * Current-server info card that doubles as a quick switcher to the other
 * servers' docs. Uses <details>/<summary> instead of a JS-driven dropdown —
 * no positioning/portal logic needed since it just expands the sidebar flow.
 */
export function ServerSwitcher({ current }: ServerSwitcherProps) {
  return (
    <details className="group/switcher">
      <summary
        className={cn(
          "list-none cursor-pointer rounded-xl border p-3.5 relative bg-linear-to-br transition-colors",
          "marker:content-none [&::-webkit-details-marker]:hidden",
          "hover:brightness-110",
          current.border,
          current.color
        )}
      >
        <div className="absolute -top-px -left-px w-4 h-4 border-t-2 border-l-2 border-primary/60 rounded-tl-xl pointer-events-none" />
        <div className="absolute -bottom-px -right-px w-4 h-4 border-b-2 border-r-2 border-primary/60 rounded-br-xl pointer-events-none" />
        <div className="absolute top-0 left-4 right-4 h-px bg-linear-to-r from-transparent via-current to-transparent opacity-20" />

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl leading-none shrink-0">{current.emoji}</span>
            <div className="min-w-0 flex-1">
              <p
                className="font-bold text-foreground leading-none text-sm truncate"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {current.name}
              </p>
              <span className={cn("text-xs px-1.5 py-0.5 rounded-full mt-1.5 inline-block", current.badge)}>
                {current.tagline}
              </span>
            </div>
            <ChevronDown
              size={16}
              className="shrink-0 text-foreground/50 transition-transform duration-200 group-open/switcher:rotate-180"
            />
          </div>
          <ServerStatusBadge host={current.host} />
        </div>
      </summary>

      <div className="mt-1.5 flex flex-col gap-1 rounded-xl border border-border bg-popover p-1.5 shadow-lg">
        {SERVERS.map((server) => {
          const isCurrent = server.id === current.id;
          return (
            <Link
              key={server.id}
              href={server.href}
              aria-current={isCurrent ? "page" : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                isCurrent
                  ? "bg-primary/10 text-primary"
                  : "text-foreground/70 hover:bg-muted hover:text-foreground"
              )}
            >
              <span className="text-lg leading-none shrink-0">{server.emoji}</span>
              <span className="min-w-0 truncate" style={{ fontFamily: "var(--font-display)" }}>
                {server.name}
              </span>
            </Link>
          );
        })}
      </div>
    </details>
  );
}
