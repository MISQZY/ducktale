import { NextResponse } from "next/server";

export async function GET(
    _req: Request,
    { params }: { params: { host: string } }
) {
    const { host } = await params;

    const res = await fetch(
        `https://api.mcsrvstat.us/3/${host}`,
        { next: { revalidate: 60 } }
    );
    const data = await res.json();
    return NextResponse.json(data);
}