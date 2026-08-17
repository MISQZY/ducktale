import { NextResponse } from "next/server";

/** Public by design (it's the VAPID *public* key) — the client needs it to call pushManager.subscribe(). Not exposed via NEXT_PUBLIC_* to avoid keeping two copies of the same value in sync; this route is the single source of truth. */
export async function GET() {
  return NextResponse.json({ publicKey: process.env.VAPID_PUBLIC_KEY ?? null });
}
