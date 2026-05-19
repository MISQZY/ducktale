"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ServerStatus } from "@/hooks/useServerStatus";

type StatusMap = Record<string, ServerStatus>;

const ServerStatusContext = createContext<StatusMap>({});

export function ServerStatusProvider({ children }: { children: React.ReactNode }) {
  const [statuses, setStatuses] = useState<StatusMap>({});

  useEffect(() => {
    fetch("/api/server-status/all")
      .then((r) => r.json())
      .then(setStatuses)
      .catch(() => setStatuses({}));
  }, []);

  return (
    <ServerStatusContext.Provider value={statuses}>
      {children}
    </ServerStatusContext.Provider>
  );
}

export function useServerStatuses() {
  return useContext(ServerStatusContext);
}