import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { siteDb } from "@/lib/site-db";
import { isRateLimited } from "@/lib/rate-limit";
import { isUsableResetToken } from "@/lib/password-reset";

const MIN_PASSWORD_LENGTH = 8;
const BCRYPT_COST = 10;

export async function POST(req: Request) {
  if (isRateLimited(req, "account-reset-password", 10, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!token) {
    return NextResponse.json({ error: "Invalid link" }, { status: 400 });
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` },
      { status: 400 }
    );
  }

  const reset = await siteDb.passwordResetToken.findUnique({ where: { token } });
  if (!reset || !isUsableResetToken(reset)) {
    return NextResponse.json({ error: "This link has expired or was already used" }, { status: 410 });
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);

  await siteDb.$transaction([
    siteDb.user.update({ where: { id: reset.userId }, data: { passwordHash } }),
    siteDb.passwordResetToken.update({ where: { id: reset.id }, data: { usedAt: new Date() } }),
  ]);

  return NextResponse.json({ ok: true });
}
