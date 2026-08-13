"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

const HEARTBEAT_INTERVAL_MS = 60_000;

/**
 * Invisible, always-mounted (see provider.tsx) — pings /api/presence/heartbeat
 * every 60s while a logged-in user has the site open in a visible tab, so
 * other visitors can see them as "online on the site" (see src/lib/presence.ts).
 * Paused entirely while the tab is hidden (visibilitychange) instead of just
 * relying on the interval, so a pile of background tabs doesn't each keep
 * pinging every minute for no one to see.
 */
export function PresenceHeartbeat() {
  const { status } = useSession();

  useEffect(() => {
    if (status !== "authenticated") return;

    let cancelled = false;
    const send = () => {
      if (document.visibilityState !== "visible") return;
      fetch("/api/presence/heartbeat", { method: "POST" }).catch(() => {});
    };

    send();
    const interval = setInterval(send, HEARTBEAT_INTERVAL_MS);

    // Coming back to a tab that's been hidden for a while shouldn't wait up
    // to a full interval to report "online" again.
    const onVisibilityChange = () => {
      if (!cancelled && document.visibilityState === "visible") send();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [status]);

  return null;
}

export default PresenceHeartbeat;
