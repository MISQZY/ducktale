"use client";

import { useServerStatuses } from "@/context/ServerStatusContext";

export interface ServerStatus {
  online: boolean;
  players?: { online: number; max: number; list?: { name: string }[] };
  version?: string;
}

export function useServerStatus(host: string): ServerStatus | null {
  const statuses = useServerStatuses();
  return Object.keys(statuses).length === 0 ? null : (statuses[host] ?? { online: false });
}