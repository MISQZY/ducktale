"use server";

import { revalidatePath } from "next/cache";
import { siteDb } from "@/lib/site-db";
import { requireResourceRoleId } from "@/lib/admin";
import { generateUniqueBadgeKey } from "@/lib/badges";
import { isBadgeIconName } from "@/config/badges";
import type { LocalizedName } from "@/lib/i18n-name";

const NAME_MAX = 64;
const TEXT_MAX = 255;
const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

interface BadgeFields {
  name: LocalizedName;
  description: string | null;
  earnCondition: string | null;
  icon: string;
  color: string | null;
}

function readBadgeFields(formData: FormData): BadgeFields {
  const ru = (formData.get("nameRu") as string | null)?.trim().slice(0, NAME_MAX) ?? "";
  if (!ru) throw new Error("Russian name is required");
  const en = (formData.get("nameEn") as string | null)?.trim().slice(0, NAME_MAX) ?? "";
  if (!en) throw new Error("English name is required");

  const icon = (formData.get("icon") as string | null)?.trim() ?? "";
  if (!isBadgeIconName(icon)) throw new Error("Invalid icon");

  const rawColor = (formData.get("color") as string | null)?.trim() ?? "";
  if (rawColor && !HEX_COLOR_PATTERN.test(rawColor)) throw new Error("Color must be a hex value like #d4a017");

  const description = (formData.get("description") as string | null)?.trim().slice(0, TEXT_MAX) || null;
  const earnCondition = (formData.get("earnCondition") as string | null)?.trim().slice(0, TEXT_MAX) || null;

  return { name: { ru, en }, description, earnCondition, icon, color: rawColor || null };
}

/** A badge can auto-grant from any number of roles (held ANY of them qualifies) — <select multiple name="autoRoleIds"> submits one entry per selection. */
function readAutoRoleIds(formData: FormData): string[] {
  const ids = formData.getAll("autoRoleIds").map((v) => String(v).trim()).filter(Boolean);
  return [...new Set(ids)];
}

export async function createBadge(lang: string, formData: FormData): Promise<void> {
  await requireResourceRoleId("badges-edit");

  const fields = readBadgeFields(formData);
  const autoRoleIds = readAutoRoleIds(formData);
  // Slugged from the Russian name — admin-facing key generation, same
  // locale convention the rest of this admin UI defaults to (form fields
  // default to the RU tab first, see LocalizedNameInput).
  const key = await generateUniqueBadgeKey(fields.name.ru);

  await siteDb.badge.create({
    data: {
      ...fields,
      key,
      autoRoles: autoRoleIds.length > 0 ? { create: autoRoleIds.map((roleId) => ({ roleId })) } : undefined,
    },
  });

  revalidatePath(`/${lang}/admin/badges`);
}

export async function updateBadge(lang: string, badgeId: string, formData: FormData): Promise<void> {
  await requireResourceRoleId("badges-edit");

  const fields = readBadgeFields(formData);
  const autoRoleIds = readAutoRoleIds(formData);

  // `key` is immutable once created — it's how code (BADGE_DEFINITIONS,
  // future awardBadge-by-key callers) references a specific badge, so
  // renaming the display name must never change it out from under them.
  // autoRoles is a join model (BadgeAutoRole), not a direct many-to-many —
  // "replace the set" means delete-then-recreate the link rows, not a
  // Prisma connect/set shorthand.
  await siteDb.$transaction([
    siteDb.badge.update({ where: { id: badgeId }, data: fields }),
    siteDb.badgeAutoRole.deleteMany({ where: { badgeId } }),
    ...(autoRoleIds.length > 0
      ? [siteDb.badgeAutoRole.createMany({ data: autoRoleIds.map((roleId) => ({ badgeId, roleId })) })]
      : []),
  ]);

  revalidatePath(`/${lang}/admin/badges`);
  revalidatePath(`/${lang}/admin/users`);
}

export async function deleteBadge(lang: string, badgeId: string): Promise<void> {
  await requireResourceRoleId("badges-delete");

  // UserBadge/BadgeAutoRole rows for this badge are onDelete: Cascade, so
  // this just removes it from whoever had it (and any auto-grant links)
  // rather than touching those rows directly.
  await siteDb.badge.delete({ where: { id: badgeId } });

  revalidatePath(`/${lang}/admin/badges`);
  revalidatePath(`/${lang}/admin/users`);
}

export async function awardBadge(lang: string, userId: string, badgeId: string): Promise<void> {
  await requireResourceRoleId("badges-edit");

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
  await requireResourceRoleId("badges-edit");

  // pinned lives on this same row, so deleting it un-pins automatically —
  // nothing extra to clean up.
  await siteDb.userBadge.deleteMany({ where: { userId, badgeId } });

  revalidatePath(`/${lang}/admin/users`);
  revalidatePath(`/${lang}/admin/badges`);
}

export async function getBadgeUsers(badgeId: string) {
  await requireResourceRoleId("badges-view");
  const rows = await siteDb.userBadge.findMany({
    where: { badgeId },
    select: {
      user: {
        select: { id: true, nickname: true, accountLink: { select: { minecraftUuid: true } } },
      },
      awardedAt: true,
    },
    orderBy: { awardedAt: "desc" },
  });

  const { resolveSkinUrls } = await import("@/lib/skin");
  const skinUrls = await resolveSkinUrls(rows.map((r) => r.user.accountLink?.minecraftUuid));

  const result = rows.map((r, i) => ({
    userId: r.user.id,
    name: r.user.nickname,
    skinUrl: skinUrls[i],
    linked: !!r.user.accountLink?.minecraftUuid,
    awardedAt: r.awardedAt,
  }));

  return result;
}
