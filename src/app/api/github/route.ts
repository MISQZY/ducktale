import { NextResponse } from "next/server";
import { fetchLastModified } from "@/lib/github";

/** Only allow paths inside the content directory (no path traversal). */
const SAFE_PATH = /^[\w\-/.]+\.mdx?$/;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const filePath = searchParams.get("filePath");

  if (!filePath) {
    return NextResponse.json({ error: "filePath is required" }, { status: 400 });
  }

  // Prevent path traversal (e.g. "../secrets") and arbitrary file requests
  if (!SAFE_PATH.test(filePath) || filePath.includes("..")) {
    return NextResponse.json({ error: "Invalid filePath" }, { status: 400 });
  }

  const result = await fetchLastModified(filePath);

  if (!result) {
    return NextResponse.json({ error: "Failed to fetch last modified data" }, { status: 500 });
  }

  return NextResponse.json(result, {
    headers: {
      // Cache at CDN level for 1 hour (matches REVALIDATE_SECONDS in lib/github.ts)
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=300",
    },
  });
}
