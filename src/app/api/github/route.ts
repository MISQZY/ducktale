import { NextResponse } from "next/server";
import { fetchLastModified } from "@/lib/github";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const filePath = searchParams.get("filePath");

  if (!filePath) {
    return NextResponse.json({ error: "filePath is required" }, { status: 400 });
  }

  const result = await fetchLastModified(filePath);

  if (!result) {
    return NextResponse.json({ error: "Failed to fetch last modified data" }, { status: 500 });
  }

  return NextResponse.json(result);
}
