"use client";

import { useServerStatuses } from "@/context/ServerStatusContext";

export interface ServerStatus {
  online: boolean;
  players?: { online: number; max: number; list?: { name: string }[] };
  version?: string;
}

export type ServerStatusResult =
  | { state: "loading" }
  | { state: "error" }
  | { state: "ok"; status: ServerStatus };

export function useServerStatus(host: string): ServerStatusResult {
  const { statuses, loading, error } = useServerStatuses();
  if (loading) return { state: "loading" };
  if (error) return { state: "error" };
  return { state: "ok", status: statuses[host] ?? { online: false } };
}
