import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma } from ".prisma/site-client";
import { siteDb } from "@/lib/site-db";
import { isRateLimited } from "@/lib/rate-limit";
import { NICKNAME_PATTERN, NICKNAME_FORMAT_ERROR, NICKNAME_TAKEN_ERROR } from "@/lib/nickname";

const MIN_PASSWORD_LENGTH = 8;
const BCRYPT_COST = 10;

export async function POST(req: Request) {
  if (isRateLimited(req, "account-register", 10, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const nickname = typeof body?.nickname === "string" ? body.nickname.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!NICKNAME_PATTERN.test(nickname)) {
    return NextResponse.json(
      { error: NICKNAME_FORMAT_ERROR },
      { status: 400 }
    );
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` },
      { status: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);

  try {
    // Relies on the site DB's case-insensitive collation (utf8mb4_unicode_ci)
    // to reject "Duck" as a duplicate of an existing "duck" at the DB level.
    const user = await siteDb.user.create({
      data: { nickname, passwordHash },
      select: { id: true, nickname: true },
    });
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: NICKNAME_TAKEN_ERROR }, { status: 409 });
    }
    console.error("[account/register] DB error:", error);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
