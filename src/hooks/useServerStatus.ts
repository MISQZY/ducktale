"use client";

import { useEffect, useState } from "react";
import { useServerStatuses } from "@/context/ServerStatusContext";

export interface ServerStatus {
  // Undefined (not just false) when the viewer lacks server-status-view —
  // that role gates online/who's-playing visibility, version stays public.
  online?: boolean;
  error?: boolean;
  maintenance?: boolean;
  players?: { online: number; max: number; list?: { name: string; skinUrl: string | null }[] };
  version?: string;
}

export type ServerStatusResult =
  | { state: "loading" }
  | { state: "error" }
  | { state: "ok"; status: ServerStatus };

export function useServerStatus(host: string): ServerStatusResult {
  const { statuses, loading, error } = useServerStatuses();
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  if (!mounted || loading) return { state: "loading" };
  if (error) return { state: "error" };
  return { state: "ok", status: statuses[host] ?? { online: false } };
}
