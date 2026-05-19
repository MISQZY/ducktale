"use client";

import { useEffect, useState } from "react";

export interface ServerStatus {
  online: boolean;
  players?: { online: number; max: number; list?: { name: string }[]  };
  version?: string;
}

export function useServerStatus(host: string) {
  const [status, setStatus] = useState<ServerStatus | null>(null);

  useEffect(() => {
    fetch(`/api/server-status/${encodeURIComponent(host)}`)
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setStatus({ online: false }));
  }, [host]);

  return status;
}