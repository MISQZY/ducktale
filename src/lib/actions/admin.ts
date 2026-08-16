"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from ".prisma/site-client";
import { siteDb } from "@/lib/site-db";
import { requireAdminId, requireResourceRoleId } from "@/lib/admin";
import { createPasswordResetToken } from "@/lib/password-reset";
import { invalidatePresenceLinkCache } from "@/lib/presence";
import { invalidateByPrefix } from "@/lib/query-cache";
import { SITE } from "@/config/site";
import { NICKNAME_PATTERN, NICKNAME_FORMAT_ERROR, NICKNAME_TAKEN_ERROR } from "@/lib/nickname";

export async function resetUserPassword(lang: string, userId: string): Promise<string> {
  await requireResourceRoleId("users-edit");

  const token = await createPasswordResetToken(userId);

  revalidatePath(`/${lang}/admin`);
  return `${SITE.url}/${lang}/account/reset-password/${token}`;
}

export async function unlinkUser(lang: string, userId: string) {
  await requireResourceRoleId("users-edit");

  await siteDb.accountLink.deleteMany({ where: { userId } });

  // See invalidatePresenceLinkCache's doc comment — unlinking must be a full
  // break, not something that keeps showing as linked/online from cache for
  // up to a minute.
  invalidatePresenceLinkCache();
  invalidateByPrefix("leaderboard:");

  revalidatePath(`/${lang}/admin`);
}

export async function deleteUser(lang: string, userId: string) {
  const adminId = await requireResourceRoleId("users-delete");
  if (adminId === userId) throw new Error("Cannot delete your own account from the admin panel");

  // AccountLink has onDelete: Cascade on its User relation.
  await siteDb.user.delete({ where: { id: userId } });

  invalidatePresenceLinkCache();
  invalidateByPrefix("leaderboard:");

  revalidatePath(`/${lang}/admin`);
}

// Deliberately NOT requireResourceRoleId("users-edit") — granting/revoking
// the isAdmin superadmin flag is superadmin-only, not delegable via a
// resource-role. A users-edit holder toggling this could mint themselves
// (or anyone) a superadmin, bypassing every other resource-role check.
export async function setUserAdmin(lang: string, userId: string, isAdmin: boolean) {
  const adminId = await requireAdminId();
  if (adminId === userId) throw new Error("Cannot change your own admin status from the admin panel");

  await siteDb.user.update({ where: { id: userId }, data: { isAdmin } });

  revalidatePath(`/${lang}/admin`);
}

export async function renameUser(lang: string, userId: string, nickname: string): Promise<string> {
  await requireResourceRoleId("users-edit");

  const cleanNickname = nickname.trim();
  if (!NICKNAME_PATTERN.test(cleanNickname)) throw new Error(NICKNAME_FORMAT_ERROR);

  try {
    // Relies on the site DB's case-insensitive collation (utf8mb4_unicode_ci)
    // to reject "Duck" as a duplicate of an existing "duck" — same rule
    // registration enforces at signup.
    await siteDb.user.update({ where: { id: userId }, data: { nickname: cleanNickname } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error(NICKNAME_TAKEN_ERROR);
    }
    throw error;
  }

  invalidateByPrefix("leaderboard:");
  revalidatePath(`/${lang}/admin`);
  return cleanNickname;
}
