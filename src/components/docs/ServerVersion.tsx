"use client";

import { SERVERS } from "@/config/servers";
import { useServerStatus } from "@/hooks/useServerStatus";

interface ServerVersionProps {
  /** Server id from `SERVERS` config, e.g. "duckburg". */
  server: string;
  /** Shown while loading or if the server is offline/unreachable. */
  fallback?: string;
}

/**
 * Renders the game version reported by the live server status ping, instead
 * of a hardcoded version number in docs content that inevitably goes stale.
 * Usage in MDX: `<ServerVersion server="duckburg" />`
 */
export function ServerVersion({ server, fallback = "…" }: ServerVersionProps) {
  const found = SERVERS.find((s) => s.id === server);

  if (!found) {
    if (process.env.NODE_ENV === "development") {
      throw new Error(
        `<ServerVersion server="${server}" /> — unknown id. ` +
          `Available: ${SERVERS.map((s) => s.id).join(", ")}.`
      );
    }
    return <strong>{fallback}</strong>;
  }

  return <ServerVersionValue host={found.host} fallback={fallback} />;
}

function ServerVersionValue({ host, fallback }: { host: string; fallback: string }) {
  const result = useServerStatus(host);
  const version =
    result.state === "ok" && result.status.online ? result.status.version : undefined;

  return <strong>{version ?? fallback}</strong>;
}
