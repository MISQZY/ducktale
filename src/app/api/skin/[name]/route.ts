import { NextResponse } from "next/server";
import { getMojangSkinUrl } from "@/lib/mojang";

export async function GET(req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  
  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  let url = await getMojangSkinUrl(name);
  
  if (!url) {
    // If Mojang fails to resolve the skin (e.g. offline/cracked player), 
    // gracefully fallback to the official MHF_Steve skin texture to mimic minotar.net
    url = await getMojangSkinUrl("MHF_Steve");
    if (!url) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }

  // Next.js will cache this response at the edge for 1 hour
  return NextResponse.redirect(url, {
    status: 302,
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
    }
  });
}
