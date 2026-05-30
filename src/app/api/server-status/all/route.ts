import { NextResponse } from "next/server";
import { SERVERS } from "@/config/servers";
import { API } from "@/config/site";

async function fetchServerStatus(host: string): Promise<{ online: boolean }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API.serverStatusTimeoutMs);
  try {
    const res = await fetch(`https://api.mcsrvstat.us/3/${host}`, {
      signal: controller.signal,
      // cache: "no-store" instead of next.revalidate —
      // revalidate inside Route Handler doesn't work as intended and
      // can conflict with AbortController in some Next.js versions.
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

export async function GET() {
  try {
    const results = await Promise.allSettled(
      SERVERS.map((s) => fetchServerStatus(s.host))
    );

    const statuses = Object.fromEntries(
      SERVERS.map((s, i) => {
        const result = results[i];
        return [
          s.host,
          result.status === "fulfilled" ? result.value : { online: false },
        ];
      })
    );

    return NextResponse.json(statuses, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
      },
    });
  } catch {
    return NextResponse.json(
      Object.fromEntries(SERVERS.map((s) => [s.host, { online: false }])),
      { status: 200 }
    );
  }
}
