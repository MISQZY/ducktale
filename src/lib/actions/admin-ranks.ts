"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { siteDb } from "@/lib/site-db";
import { requireResourceRoleId } from "@/lib/admin";
import { isBadgeIconName } from "@/config/badges";
import { withDb } from "@/lib/db";
import type { LocalizedName } from "@/lib/i18n-name";

const NAME_MAX = 64;
const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

interface RankFields {
  group: string;
  name:  LocalizedName;
  icon:  string;
  color: string | null;
}

function readRankFields(formData: FormData): RankFields {
  const group = (formData.get("group") as string | null)?.trim().slice(0, NAME_MAX) ?? "";
  if (!group) throw new Error("LuckPerms group is required");

  const ru = (formData.get("nameRu") as string | null)?.trim().slice(0, NAME_MAX) ?? "";
  if (!ru) throw new Error("Russian name is required");
  const en = (formData.get("nameEn") as string | null)?.trim().slice(0, NAME_MAX) ?? "";
  if (!en) throw new Error("English name is required");

  const icon = (formData.get("icon") as string | null)?.trim() ?? "";
  if (!isBadgeIconName(icon)) throw new Error("Invalid icon");

  const rawColor = (formData.get("color") as string | null)?.trim() ?? "";
  if (rawColor && !HEX_COLOR_PATTERN.test(rawColor)) throw new Error("Color must be a hex value like #d4a017");

  return { group, name: { ru, en }, icon, color: rawColor || null };
}

function rethrowFriendly(err: unknown): never {
  if (err instanceof PrismaClientKnownRequestError && err.code === "P2002") {
    throw new Error("This group already has a display configured");
  }
  throw err;
}

export async function createRank(lang: string, formData: FormData): Promise<void> {
  await requireResourceRoleId("ranks-edit");

  const fields = readRankFields(formData);
  try {
    await siteDb.luckPermsRole.create({ data: fields });
  } catch (err) {
    rethrowFriendly(err);
  }

  revalidatePath(`/${lang}/admin/ranks`);
}

export async function updateRank(lang: string, rankId: string, formData: FormData): Promise<void> {
  await requireResourceRoleId("ranks-edit");

  const fields = readRankFields(formData);
  try {
    await siteDb.luckPermsRole.update({ where: { id: rankId }, data: fields });
  } catch (err) {
    rethrowFriendly(err);
  }

  revalidatePath(`/${lang}/admin/ranks`);
  revalidatePath(`/${lang}/admin/badges`);
}

export async function deleteRank(lang: string, rankId: string): Promise<void> {
  await requireResourceRoleId("ranks-delete");

  // Any BadgeAutoRole link row pointing here is onDelete: Cascade, so this
  // just drops that badge's auto-grant condition on this rank — the badge
  // itself, and any of its other linked ranks, survive.
  await siteDb.luckPermsRole.delete({ where: { id: rankId } });

  revalidatePath(`/${lang}/admin/ranks`);
  revalidatePath(`/${lang}/admin/badges`);
}

export async function getRankUsers(group: string) {
  await requireResourceRoleId("ranks-view");

  // Find all UUIDs that have this group permission
  const rows = await withDb("luckperms", async (db) => {
    return await db.$queryRaw`
      SELECT DISTINCT uuid
      FROM lp_user_permissions
      WHERE permission = ${'group.' + group}
        AND value = 1
        AND (expiry = 0 OR expiry > UNIX_TIMESTAMP())
    ` as { uuid: string }[];
  });

  const uuids = rows.map(r => r.uuid);

  if (uuids.length === 0) {
    return [];
  }

  // Find the minecraft names for these UUIDs if they linked their account
  // Some users might not be linked, so we'll just return their UUIDs if we can't find a name.
  // status: CONFIRMED is technically redundant here — minecraftUuid is null
  // on any non-confirmed link (see MINECRAFT_ACCOUNT_LINK.md / requestNewLinkCode,
  // which clears both fields on every reset to PENDING), so it can never
  // match this uuids list anyway — kept for parity with every other
  // accountLink-by-uuid lookup in the codebase (leaderboard, presence,
  // admin users/tickets, showcase), all of which filter explicitly instead
  // of relying on that invariant staying true.
  const links = await siteDb.accountLink.findMany({
    where: { minecraftUuid: { in: uuids }, status: "CONFIRMED" },
    select: { minecraftUuid: true, minecraftName: true, user: { select: { nickname: true } } }
  });

  const nameMap = new Map<string, string>(
    links.map(l => [l.minecraftUuid!, l.user?.nickname || l.minecraftName || "Unknown"])
  );

  const missingUuids = uuids.filter(u => !nameMap.has(u));
  if (missingUuids.length > 0) {
    const fpPlayers = await withDb("default", async (db) => {
      return await db.$queryRaw`
        SELECT uuid, name as username
        FROM fp_player
        WHERE uuid IN (${Prisma.join(missingUuids)}) AND uuid NOT IN ('00000000-0000-0000-0000-000000000000', '0000-0000-0000-0000')
      ` as { uuid: string, username: string }[];
    });
    for (const p of fpPlayers) {
      nameMap.set(p.uuid, p.username);
    }
  }

  const { resolveSkinUrls } = await import("@/lib/skin");
  const skinUrls = await resolveSkinUrls(uuids);

  return uuids.map((uuid, i) => ({
    uuid,
    name: nameMap.get(uuid) || null,
    skinUrl: skinUrls[i],
    hasSiteProfile: !!links.find(l => l.minecraftUuid === uuid)?.user
  }));
}
