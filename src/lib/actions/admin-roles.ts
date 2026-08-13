"use server";

import { revalidatePath } from "next/cache";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { siteDb } from "@/lib/site-db";
import { requireAdminId } from "@/lib/admin";
import { isBadgeIconName } from "@/config/badges";

const NAME_MAX = 64;
const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

interface RoleFields {
  group: string;
  name:  string;
  icon:  string;
  color: string | null;
}

function readRoleFields(formData: FormData): RoleFields {
  const group = (formData.get("group") as string | null)?.trim().slice(0, NAME_MAX) ?? "";
  if (!group) throw new Error("LuckPerms group is required");

  const name = (formData.get("name") as string | null)?.trim().slice(0, NAME_MAX) ?? "";
  if (!name) throw new Error("Name is required");

  const icon = (formData.get("icon") as string | null)?.trim() ?? "";
  if (!isBadgeIconName(icon)) throw new Error("Invalid icon");

  const rawColor = (formData.get("color") as string | null)?.trim() ?? "";
  if (rawColor && !HEX_COLOR_PATTERN.test(rawColor)) throw new Error("Color must be a hex value like #d4a017");

  return { group, name, icon, color: rawColor || null };
}

function rethrowFriendly(err: unknown): never {
  if (err instanceof PrismaClientKnownRequestError && err.code === "P2002") {
    throw new Error("This group already has a display configured");
  }
  throw err;
}

export async function createRole(lang: string, formData: FormData): Promise<void> {
  await requireAdminId();

  const fields = readRoleFields(formData);
  try {
    await siteDb.luckPermsRole.create({ data: fields });
  } catch (err) {
    rethrowFriendly(err);
  }

  revalidatePath(`/${lang}/admin/roles`);
}

export async function updateRole(lang: string, roleId: string, formData: FormData): Promise<void> {
  await requireAdminId();

  const fields = readRoleFields(formData);
  try {
    await siteDb.luckPermsRole.update({ where: { id: roleId }, data: fields });
  } catch (err) {
    rethrowFriendly(err);
  }

  revalidatePath(`/${lang}/admin/roles`);
  revalidatePath(`/${lang}/admin/badges`);
}

export async function deleteRole(lang: string, roleId: string): Promise<void> {
  await requireAdminId();

  // Any BadgeAutoRole link row pointing here is onDelete: Cascade, so this
  // just drops that badge's auto-grant condition on this role — the badge
  // itself, and any of its other linked roles, survive.
  await siteDb.luckPermsRole.delete({ where: { id: roleId } });

  revalidatePath(`/${lang}/admin/roles`);
  revalidatePath(`/${lang}/admin/badges`);
}
