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
    // The built-in "user" Role (src/config/roles.ts, seeded by
    // seedBuiltinRoles()) is the sole auto-granted Role for every new
    // registration — matched by its stable key, same as getGuestResourceRoles()
    // does for "guest". Read before the create so a brand-new user's very
    // first session already reflects it, rather than a separate post-create
    // step that could fail independently and leave the user without it. If
    // the row hasn't been seeded yet (nobody's visited /admin/roles), the
    // user is simply created without it — seedBuiltinRoles() doesn't
    // backfill existing users either way.
    const userRole = await siteDb.role.findUnique({ where: { key: "user" }, select: { id: true } });

    // Relies on the site DB's case-insensitive collation (utf8mb4_unicode_ci)
    // to reject "Duck" as a duplicate of an existing "duck" at the DB level.
    const user = await siteDb.user.create({
      data: {
        nickname,
        passwordHash,
        roles: userRole ? { create: { roleId: userRole.id } } : undefined,
      },
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
