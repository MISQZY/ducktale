import { useEffect } from "react";

/**
 * Runs `poll` on a fixed interval while the tab is visible, plus once via the
 * same `visibilitychange` listener whenever the tab becomes visible again
 * (so switching back doesn't wait out a stale interval). Shared by
 * TicketThread and ThreadView, which otherwise duplicated this exact
 * interval + visibilitychange + cleanup pattern. No-ops entirely (interval
 * never starts) while `enabled` is false — e.g. ThreadView stops polling a
 * closed thread, since it can't receive new messages anyway.
 */
export function usePolling(poll: () => void, intervalMs: number, enabled: boolean = true): void {
  useEffect(() => {
    if (!enabled) return;
    function tick() {
      if (document.visibilityState === "visible") poll();
    }
    const interval = setInterval(tick, intervalMs);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [poll, intervalMs, enabled]);
}
