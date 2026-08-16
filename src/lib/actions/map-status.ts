"use server";

import { siteDb } from "@/lib/site-db";

export interface MapStatusResult {
  ok: boolean;
  status: number | null;
}

const CHECK_TIMEOUT_MS = 8_000;

/**
 * Server-side status check of a configured map's URL — looked up by mapId
 * (an existing ServerMap row), never a caller-supplied string, so this
 * can't be used as an open fetch-any-URL SSRF proxy; the only URLs it will
 * ever request are ones an admin already set on /admin/maps and that are
 * already publicly embedded on the map page anyway.
 *
 * This exists because an <iframe>'s onLoad fires on a real HTTP 4xx/5xx
 * from a cross-origin src exactly the same as it does on success — the
 * browser doesn't expose the response status to page script for
 * cross-origin content, so MapEmbed has no way to notice a broken link
 * from the iframe alone (and would otherwise only notice via its own
 * load-timeout, several seconds later, and only for a dead host rather
 * than a server that's up but answering with an error page).
 */
export async function checkMapStatus(mapId: string): Promise<MapStatusResult> {
  const map = await siteDb.serverMap.findUnique({ where: { id: mapId }, select: { url: true } });
  if (!map) return { ok: false, status: null };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS);
  try {
    const res = await fetch(map.url, { method: "GET", signal: controller.signal, redirect: "follow" });
    return { ok: res.ok, status: res.status };
  } catch {
    return { ok: false, status: null };
  } finally {
    clearTimeout(timeout);
  }
}
