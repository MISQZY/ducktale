import { API } from "@/config/site";
import { EXTERNAL_APIS } from "@/config/external-apis";
import * as util from "minecraft-server-util";

interface McsrvstatPing {
  online: boolean;
  version?: string;
  players?: { max?: number };
  [key: string]: unknown;
}

const SUCCESS_TTL_MS = 60 * 60 * 1000;
const FAILURE_TTL_MS = 5 * 60 * 1000;

const cache = new Map<string, { data: McsrvstatPing; fetchedAt: number }>();
const inflight = new Map<string, Promise<McsrvstatPing>>();

async function fetchPing(host: string): Promise<McsrvstatPing> {
  try {
    let hostname = host;
    let port = 25565;
    let enableSrv = true;
    if (host.includes(":")) {
      const parts = host.split(":");
      hostname = parts[0];
      port = parseInt(parts[1], 10);
      enableSrv = false; // Never use SRV if the user explicitly defined a port
    }

    const result = await util.status(hostname, port, {
      timeout: API.serverStatusTimeoutMs,
      enableSRV: enableSrv,
    });

    return {
      online: true,
      version: result.version.name,
      players: { max: result.players.max },
    };
  } catch (error) {
    // If it fails (e.g. offline, timeout, network error), return our error state
    return { online: false, _isError: true };
  }
}

export async function getCachedPing(host: string): Promise<McsrvstatPing> {
  const cached = cache.get(host);
  const now = Date.now();
  
  // If it was an API error (timeout/429), retry much sooner than a valid "offline" status (15s vs 5m)
  const ttl = cached?.data._isError ? 15_000 : (cached?.data.online === false ? FAILURE_TTL_MS : SUCCESS_TTL_MS);

  if (cached && now - cached.fetchedAt < ttl) {
    return cached.data;
  }

  const existingInflight = inflight.get(host);
  if (existingInflight) {
    return existingInflight;
  }

  const promise = fetchPing(host).then((data) => {
    cache.set(host, { data, fetchedAt: Date.now() });
    inflight.delete(host);
    return data;
  });

  inflight.set(host, promise);
  return promise;
}