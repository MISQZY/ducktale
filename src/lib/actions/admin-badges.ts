"use server";

import { revalidatePath } from "next/cache";
import { siteDb } from "@/lib/site-db";
import { requireAdminId } from "@/lib/admin";
import { generateUniqueBadgeKey } from "@/lib/badges";
import { isBadgeIconName } from "@/config/badges";

const NAME_MAX = 64;
const TEXT_MAX = 255;
const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

interface BadgeFields {
  name: string;
  description: string | null;
  earnCondition: string | null;
  icon: string;
  color: string | null;
}

function readBadgeFields(formData: FormData): BadgeFields {
  const name = (formData.get("name") as string | null)?.trim().slice(0, NAME_MAX) ?? "";
  if (!name) throw new Error("Name is required");

  const icon = (formData.get("icon") as string | null)?.trim() ?? "";
  if (!isBadgeIconName(icon)) throw new Error("Invalid icon");

  const rawColor = (formData.get("color") as string | null)?.trim() ?? "";
  if (rawColor && !HEX_COLOR_PATTERN.test(rawColor)) throw new Error("Color must be a hex value like #d4a017");

  const description = (formData.get("description") as string | null)?.trim().slice(0, TEXT_MAX) || null;
  const earnCondition = (formData.get("earnCondition") as string | null)?.trim().slice(0, TEXT_MAX) || null;

  return { name, description, earnCondition, icon, color: rawColor || null };
}

export async function createBadge(lang: string, formData: FormData): Promise<void> {
  await requireAdminId();

  const fields = readBadgeFields(formData);
  const key = await generateUniqueBadgeKey(fields.name);

  await siteDb.badge.create({ data: { ...fields, key } });

  revalidatePath(`/${lang}/admin/badges`);
}

export async function updateBadge(lang: string, badgeId: string, formData: FormData): Promise<void> {
  await requireAdminId();

  const fields = readBadgeFields(formData);

  // `key` is immutable once created — it's how code (BADGE_DEFINITIONS,
  // future awardBadge-by-key callers) references a specific badge, so
  // renaming the display name must never change it out from under them.
  await siteDb.badge.update({ where: { id: badgeId }, data: fields });

  revalidatePath(`/${lang}/admin/badges`);
  revalidatePath(`/${lang}/admin/users`);
}

export async function deleteBadge(lang: string, badgeId: string): Promise<void> {
  await requireAdminId();

  // UserBadge rows for this badge are onDelete: Cascade, so this just
  // removes it from whoever had it rather than touching those user rows.
  await siteDb.badge.delete({ where: { id: badgeId } });

  revalidatePath(`/${lang}/admin/badges`);
  revalidatePath(`/${lang}/admin/users`);
}

export async function awardBadge(lang: string, userId: string, badgeId: string): Promise<void> {
  await requireAdminId();

  // upsert (not create) — re-awarding a badge the user already has is a
  // harmless no-op rather than a unique-constraint error.
  await siteDb.userBadge.upsert({
    where: { userId_badgeId: { userId, badgeId } },
    create: { userId, badgeId },
    update: {},
  });

  revalidatePath(`/${lang}/admin/users`);
}

export async function revokeBadge(lang: string, userId: string, badgeId: string): Promise<void> {
  await requireAdminId();

  await siteDb.userBadge.deleteMany({ where: { userId, badgeId } });

  revalidatePath(`/${lang}/admin/users`);
}
