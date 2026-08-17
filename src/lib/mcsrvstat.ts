import { API } from "@/config/site";
import { EXTERNAL_APIS } from "@/config/external-apis";

interface McsrvstatPing {
  online: boolean;
  version?: string;
  players?: { max?: number };
  [key: string]: unknown;
}

const SUCCESS_TTL_MS = 60 * 60 * 1000;
const FAILURE_TTL_MS = 5 * 60 * 1000;

const cache = new Map<string, { data: McsrvstatPing; fetchedAt: number }>();

async function fetchPing(host: string): Promise<McsrvstatPing> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API.serverStatusTimeoutMs);

  try {
    const res = await fetch(EXTERNAL_APIS.mcsrvstat.pingUrl(host), {
      signal: controller.signal,
      cache: "no-store",
    });
    if (!res.ok) return { online: false };
    return await res.json();
  } catch {
    return { online: false };
  } finally {
    clearTimeout(timer);
  }
}

export async function getCachedPing(host: string): Promise<McsrvstatPing> {
  const cached = cache.get(host);
  const now = Date.now();
  const ttl = cached?.data.online === false ? FAILURE_TTL_MS : SUCCESS_TTL_MS;

  if (cached && now - cached.fetchedAt < ttl) {
    return cached.data;
  }

  const data = await fetchPing(host);
  cache.set(host, { data, fetchedAt: now });
  return data;
}