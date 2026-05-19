import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ host: string }> }
) {
  const { host } = await params;

  try {
    const res = await fetch(`https://api.mcsrvstat.us/3/${host}`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return NextResponse.json({ online: false }, { status: 200 });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ online: false }, { status: 200 });
  }
}