"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { siteDb } from "@/lib/site-db";
import { generateRandomPassword, requireAdminId } from "@/lib/admin";

const BCRYPT_COST = 10;

export async function resetUserPassword(lang: string, userId: string): Promise<string> {
  await requireAdminId();

  const password = generateRandomPassword();
  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
  await siteDb.user.update({ where: { id: userId }, data: { passwordHash } });

  revalidatePath(`/${lang}/admin`);
  return password;
}

export async function unlinkUser(lang: string, userId: string) {
  await requireAdminId();

  await siteDb.accountLink.deleteMany({ where: { userId } });

  revalidatePath(`/${lang}/admin`);
}

export async function deleteUser(lang: string, userId: string) {
  const adminId = await requireAdminId();
  if (adminId === userId) throw new Error("Cannot delete your own account from the admin panel");

  // AccountLink has onDelete: Cascade on its User relation.
  await siteDb.user.delete({ where: { id: userId } });

  revalidatePath(`/${lang}/admin`);
}

export async function setUserAdmin(lang: string, userId: string, isAdmin: boolean) {
  const adminId = await requireAdminId();
  if (adminId === userId) throw new Error("Cannot change your own admin status from the admin panel");

  await siteDb.user.update({ where: { id: userId }, data: { isAdmin } });

  revalidatePath(`/${lang}/admin`);
}
