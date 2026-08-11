import { randomBytes } from "crypto";
import { siteDb } from "@/lib/site-db";

export const PASSWORD_RESET_TOKEN_TTL_MS = 24 * 60 * 60_000;

function generateResetToken(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * Issues a fresh one-time reset link for this user, deleting any previously
 * issued (but unused) tokens first — only the most recent link an admin
 * hands out is ever valid.
 */
export async function createPasswordResetToken(userId: string): Promise<string> {
  await siteDb.passwordResetToken.deleteMany({ where: { userId } });

  const token = generateResetToken();
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS);
  await siteDb.passwordResetToken.create({ data: { userId, token, expiresAt } });

  return token;
}

/** Split out of the page component so the Date.now() call isn't inline in a component body (react-hooks/purity). */
export function isUsableResetToken(
  reset: { expiresAt: Date; usedAt: Date | null } | null | undefined
): boolean {
  return !!reset && !reset.usedAt && reset.expiresAt.getTime() > Date.now();
}
