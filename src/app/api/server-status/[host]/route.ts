import { NextResponse } from "next/server";
import { API } from "@/config/site";

/** Allowlist of known MC server hosts to prevent SSRF via arbitrary host injection. */
import { SERVERS, NETWORK_HOST } from "@/config/servers";

const ALLOWED_HOSTS = new Set([
  NETWORK_HOST,
  ...SERVERS.map((s) => s.host),
]);

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ host: string }> }
) {
  const { host } = await params;

  // Validate host against known servers to prevent SSRF
  if (!ALLOWED_HOSTS.has(host)) {
    return NextResponse.json({ error: "Unknown host" }, { status: 400 });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API.serverStatusTimeoutMs);
  try {
    const res = await fetch(`https://api.mcsrvstat.us/3/${host}`, {
      signal: controller.signal,
      cache: "no-store",
    });
    if (!res.ok) return NextResponse.json({ online: false });
    return NextResponse.json(await res.json(), {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30" },
    });
  } catch {
    return NextResponse.json({ online: false });
  } finally {
    clearTimeout(timer);
  }
}
