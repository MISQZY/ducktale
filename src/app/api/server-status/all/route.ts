import { NextResponse } from "next/server";
import { SERVERS } from "@/config/servers";

export async function GET() {
  try {
    const results = await Promise.allSettled(
      SERVERS.map((s) =>
        fetch(`https://api.mcsrvstat.us/3/${s.host}`, {
          next: { revalidate: 60 },
        }).then((r) => r.json())
      )
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

    return NextResponse.json(statuses);
  } catch {
    return NextResponse.json(
      Object.fromEntries(SERVERS.map((s) => [s.host, { online: false }])),
      { status: 200 }
    );
  }
}