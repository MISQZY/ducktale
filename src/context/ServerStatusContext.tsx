"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ServerStatus } from "@/hooks/useServerStatus";

type StatusMap = Record<string, ServerStatus>;

type StatusState = {
  statuses: StatusMap;
  loading: boolean;
  error: boolean;
};

const ServerStatusContext = createContext<StatusState>({
  statuses: {},
  loading: true,
  error: false,
});

const POLL_INTERVAL_MS = 90_000;

export function ServerStatusProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<StatusState>({ statuses: {}, loading: true, error: false });

  useEffect(() => {
    let cancelled = false;

    async function fetchStatuses() {
      try {
        const r = await fetch("/api/server-status/all");
        if (!r.ok) throw new Error("non-ok");
        const data = await r.json();
        if (!cancelled) setState({ statuses: data, loading: false, error: false });
      } catch {
        if (!cancelled) setState((prev) => ({ ...prev, loading: false, error: true }));
      }
    }

    fetchStatuses();
    const id = setInterval(fetchStatuses, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <ServerStatusContext.Provider value={state}>
      {children}
    </ServerStatusContext.Provider>
  );
}

export function useServerStatuses() {
  return useContext(ServerStatusContext);
}
