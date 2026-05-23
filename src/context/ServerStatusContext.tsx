"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { ServerStatus } from "@/hooks/useServerStatus";

type StatusMap = Record<string, ServerStatus>;

type StatusState = {
  statuses: StatusMap;
  loading: boolean;
  refreshing: boolean;
  error: boolean;
};

const ServerStatusContext = createContext<StatusState>({
  statuses: {},
  loading: true,
  refreshing: false,
  error: false,
});

const POLL_INTERVAL_MS = 90_000;

export function ServerStatusProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<StatusState>({ statuses: {}, loading: true, refreshing: false, error: false });

  const fetchStatuses = useCallback(async () => {
    setState((prev) =>
      prev.loading
        ? prev
        : { ...prev, refreshing: true }
    );
    try {
      const r = await fetch("/api/server-status/all");
      if (!r.ok) throw new Error("non-ok");
      const data = await r.json();
      setState({ statuses: data, loading: false, refreshing: false, error: false });
    } catch {
      setState((prev) => ({ ...prev, loading: false, refreshing: false, error: true }));
    }
  }, []);

  useEffect(() => {
    fetchStatuses();
    const id = setInterval(fetchStatuses, POLL_INTERVAL_MS);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") fetchStatuses();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [fetchStatuses]);

  return (
    <ServerStatusContext.Provider value={state}>
      {children}
    </ServerStatusContext.Provider>
  );
}

export function useServerStatuses() {
  return useContext(ServerStatusContext);
}
