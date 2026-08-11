import { randomBytes } from "crypto";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { siteDb } from "@/lib/site-db";

/**
 * Re-checked against the DB on every call rather than cached on the JWT
 * session, so revoking admin takes effect immediately instead of waiting
 * for the user's session token to expire/refresh.
 */
export async function requireAdmin(lang: string) {
  const session = await auth();
  if (!session?.user?.id) redirect(`/${lang}/account/login`);

  const user = await siteDb.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, isAdmin: true },
  });
  if (!user?.isAdmin) redirect(`/${lang}/account`);

  return user;
}

/** Same DB check as requireAdmin, but throws instead of redirecting — for use inside Server Actions, which are directly callable and have no page to redirect away from. */
export async function requireAdminId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const user = await siteDb.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, isAdmin: true },
  });
  if (!user?.isAdmin) throw new Error("Not authorized");

  return user.id;
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
