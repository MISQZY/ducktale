import { NextResponse } from "next/server";
import { getMojangSkinUrl } from "@/lib/mojang";

export async function GET(req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  
  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const url = await getMojangSkinUrl(name);
  
  if (!url) {
    // If Mojang fails to resolve the skin, redirect to a fallback Steve/Alex skin?
    // Minotar returns a default Steve skin for unknown users.
    // We can return a 404 for now, SkinFace falls back to a placeholder.
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Next.js will cache this response at the edge for 1 hour
  return NextResponse.redirect(url, {
    status: 302,
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
    }
  });
}
