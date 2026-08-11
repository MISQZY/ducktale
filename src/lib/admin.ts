import { randomBytes } from "crypto";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

/**
 * session.user.isAdmin comes from auth.ts's session() callback, which
 * re-reads it from the DB on every session read rather than trusting a
 * cached JWT claim — so this is still live per-request, not stale until
 * the user's token happens to refresh.
 */
export async function requireAdmin(lang: string) {
  const session = await auth();
  if (!session?.user?.id) redirect(`/${lang}/account/login`);

  if (!session.user.isAdmin) redirect(`/${lang}/account`);
  return session.user;
}

/** Same DB check as requireAdmin, but throws instead of redirecting — for use inside Server Actions, which are directly callable and have no page to redirect away from. */
export async function requireAdminId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  if (!session.user.isAdmin) throw new Error("Not authorized");
  return session.user.id;
}

const PASSWORD_ALPHABET = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** A one-time password for an admin to hand off to a user out-of-band (Discord/Telegram). */
export function generateRandomPassword(length = 14): string {
  const bytes = randomBytes(length);
  let password = "";
  for (let i = 0; i < length; i++) {
    password += PASSWORD_ALPHABET[bytes[i] % PASSWORD_ALPHABET.length];
  }
  return password;
}
