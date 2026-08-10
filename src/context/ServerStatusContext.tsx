"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import type { ServerStatus } from "@/hooks/useServerStatus";
import { API } from "@/config/site";

type StatusMap = Record<string, ServerStatus>;

interface StatusState {
  statuses:   StatusMap;
  loading:    boolean;
  refreshing: boolean;
  error:      boolean;
}

const DEFAULT_STATE: StatusState = {
  statuses:   {},
  loading:    true,
  refreshing: false,
  error:      false,
};

const ServerStatusContext = createContext<StatusState>(DEFAULT_STATE);

export function ServerStatusProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<StatusState>(DEFAULT_STATE);

  const fetchStatuses = useCallback(async () => {
    setState((prev) =>
      prev.loading ? prev : { ...prev, refreshing: true }
    );
    try {
      const r = await fetch("/api/server-status/all");
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      setState({ statuses: data, loading: false, refreshing: false, error: false });
    } catch {
      setState((prev) => ({ ...prev, loading: false, refreshing: false, error: true }));
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- kicking off polling + initial fetch on mount, standard data-fetching pattern
    fetchStatuses();

    // Only poll while the tab is actually visible — a backgrounded tab has
    // no reason to keep hitting the endpoint every pollIntervalMs.
    let id: ReturnType<typeof setInterval> | null = setInterval(fetchStatuses, API.pollIntervalMs);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchStatuses();
        if (id === null) id = setInterval(fetchStatuses, API.pollIntervalMs);
      } else if (id !== null) {
        clearInterval(id);
        id = null;
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      if (id !== null) clearInterval(id);
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
