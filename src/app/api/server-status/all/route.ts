import { NextResponse } from "next/server";
import { SERVERS } from "@/config/servers";

const FETCH_TIMEOUT_MS = 5000;

async function fetchServerStatus(host: string): Promise<{ online: boolean }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(`https://api.mcsrvstat.us/3/${host}`, {
      signal: controller.signal,
      next: { revalidate: 60 },
    });
    if (!res.ok) return { online: false };
    return await res.json();
  } catch {
    return { online: false };
  } finally {
    clearTimeout(timer);
  }
}

export async function GET() {
  const results = await Promise.allSettled(
    SERVERS.map((s) => fetchServerStatus(s.host))
  );

  const statuses = Object.fromEntries(
    SERVERS.map((s, i) => {
      const result = results[i];
      return [s.host, result.status === "fulfilled" ? result.value : { online: false }];
    })
  );

  return NextResponse.json(statuses);
}
