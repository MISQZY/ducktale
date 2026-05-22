import { NextResponse } from "next/server";

const FETCH_TIMEOUT_MS = 8000;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ host: string }> }
) {
  const { host } = await params;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
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
