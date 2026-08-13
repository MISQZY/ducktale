import { Prisma } from "@prisma/client";
import { withDb } from "@/lib/db";
import { withCache } from "@/lib/query-cache";
import { siteDb } from "@/lib/site-db";

/**
 * One resolved role for the player — either the highest-ranked held group
 * on a real lp_tracks entry (trackKey = that track's name), or a curated
 * "standalone" group that isn't part of any track at all (e.g. a donor/
 * media perk group) — trackKey is just the group name in that case, since
 * there's no real track to name it after and no rank to compete with.
 */
export interface PlayerTrackRole {
  trackKey: string;
  group:    string;
  name:     string;
  icon:     string;
  color:    string | null;
}

const GROUPS_TTL_MS = 60_000;
const TRACKS_TTL_MS = 5 * 60_000;
const ROLE_DISPLAY_TTL_MS = 5 * 60_000;
const AUTO_CONDITION_BADGES_TTL_MS = 5 * 60_000;

interface GroupPermissionRow {
  permission: string;
}

/**
 * Every LuckPerms group `uuid` currently holds, resolved from
 * `group.<name>` permission nodes — LuckPerms has no separate "group
 * membership" table, group membership IS a permission node. Excludes
 * explicitly-denied (`value = 0`) and expired (`expiry` is a unix-seconds
 * timestamp, 0 meaning "never expires") rows.
 */
async function resolvePlayerGroupsUncached(uuid: string): Promise<Set<string>> {
  const rows = await withDb("luckperms", async (db) => {
    return await db.$queryRaw(Prisma.sql`
      SELECT permission
      FROM lp_user_permissions
      WHERE uuid = ${uuid}
        AND value = 1
        AND permission LIKE 'group.%'
        AND (expiry = 0 OR expiry > UNIX_TIMESTAMP())
    `) as GroupPermissionRow[];
  });

  return new Set(rows.map((r) => r.permission.slice("group.".length)));
}

export async function resolvePlayerGroups(uuid: string): Promise<Set<string>> {
  return withCache(`luckperms:groups:${uuid}`, GROUPS_TTL_MS, () => resolvePlayerGroupsUncached(uuid));
}

interface Track {
  name: string;
  /** Ordered lowest -> highest rank, straight from LuckPerms' own lp_tracks.groups JSON array. */
  groups: string[];
}

/** LuckPerms' own tracks, read live — contrary to LuckPerms' general docs, lp_tracks DOES store each track's ordered group list (confirmed against the real DB), so this is the source of truth for track membership/rank, not something mirrored by hand in the site DB. */
async function getTracksUncached(): Promise<Track[]> {
  const rows = await withDb("luckperms", (db) => db.lp_tracks.findMany());

  return rows.map((row) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(row.groups);
    } catch {
      parsed = [];
    }
    const groups = Array.isArray(parsed) ? parsed.filter((g): g is string => typeof g === "string") : [];
    return { name: row.name, groups };
  });
}

async function getTracks(): Promise<Track[]> {
  return withCache("luckperms:tracks", TRACKS_TTL_MS, getTracksUncached);
}

/** Admin-configured display (name/icon/color) per LuckPerms group — src/prisma/site/schema.prisma.template's LuckPermsRole. Same rows regardless of which player is asking. */
async function getRoleDisplayCatalog() {
  return withCache("luckperms:roleDisplay", ROLE_DISPLAY_TTL_MS, () => siteDb.luckPermsRole.findMany());
}

/**
 * Two kinds of resolved role, both gated on being curated in
 * /admin/roles — a group with no display entry never shows up, whether
 * it's part of a track or not:
 *
 * - Track-based: for each of LuckPerms' own tracks (lp_tracks), the
 *   highest-ranked group in its ordered list that the player currently
 *   holds — "each track = one current role" (a player promoted from
 *   moderator to admin still only shows "Admin", not both).
 * - Standalone: a curated group that isn't a member of *any* lp_tracks
 *   entry (e.g. "media", "supporter" — perk/cosmetic groups, not part of a
 *   ranked progression) shows directly if the player holds it. There's
 *   nothing to out-rank it, so no competition logic needed.
 */
export async function resolvePlayerTrackRoles(uuid: string): Promise<PlayerTrackRole[]> {
  const [tracks, heldGroups, displayCatalog] = await Promise.all([
    getTracks(),
    resolvePlayerGroups(uuid),
    getRoleDisplayCatalog(),
  ]);

  const displayByGroup = new Map(displayCatalog.map((d) => [d.group, d]));
  const trackedGroups = new Set(tracks.flatMap((t) => t.groups));

  const roles: PlayerTrackRole[] = [];

  for (const track of tracks) {
    // Walk from the end (highest rank) so the first held group found is the player's current role on this track.
    let highestHeldGroup: string | undefined;
    for (let i = track.groups.length - 1; i >= 0; i--) {
      if (heldGroups.has(track.groups[i])) {
        highestHeldGroup = track.groups[i];
        break;
      }
    }
    if (!highestHeldGroup) continue;

    const display = displayByGroup.get(highestHeldGroup);
    if (!display) continue;

    roles.push({
      trackKey: track.name,
      group: highestHeldGroup,
      name: display.name,
      icon: display.icon,
      color: display.color,
    });
  }

  for (const display of displayCatalog) {
    if (trackedGroups.has(display.group)) continue; // handled above via its track
    if (!heldGroups.has(display.group)) continue;

    roles.push({
      trackKey: display.group,
      group: display.group,
      name: display.name,
      icon: display.icon,
      color: display.color,
    });
  }

  return roles;
}

/**
 * Lazily auto-grants any Badge whose linked roles (autoRoles — a badge can
 * have several, ANY held group qualifies) the linked account's Minecraft
 * player currently holds — called on that account's own profile page load
 * (no cron/worker in this codebase). Purely additive: never revokes a
 * previously-auto-granted badge if the player no longer holds the role,
 * matching how manually-awarded badges are also never auto-revoked — a
 * badge is a permanent achievement record, not a live role indicator
 * (that's what the role badges themselves are for).
 */
/** The badge catalog's auto-grant conditions — same rows regardless of which account is being checked, so this is cached like getRoleDisplayCatalog rather than re-queried on every /profile load. */
function getAutoConditionBadges() {
  return withCache("luckperms:autoConditionBadges", AUTO_CONDITION_BADGES_TTL_MS, () =>
    siteDb.badge.findMany({
      where: { autoRoles: { some: {} } },
      select: { id: true, autoRoles: { select: { role: { select: { group: true } } } } },
    })
  );
}

export async function evaluateAutoBadges(userId: string, minecraftUuid: string): Promise<void> {
  const [heldGroups, autoConditionBadges] = await Promise.all([
    resolvePlayerGroups(minecraftUuid),
    getAutoConditionBadges(),
  ]);

  const toAward = autoConditionBadges.filter((b) => b.autoRoles.some((ar) => heldGroups.has(ar.role.group)));
  if (toAward.length === 0) return;

  // One batched insert instead of N individual upserts — skipDuplicates
  // makes this the same "insert or ignore" semantics as the old per-badge
  // upsert, since a badge is never auto-revoked once earned.
  await siteDb.userBadge.createMany({
    data: toAward.map((b) => ({ userId, badgeId: b.id })),
    skipDuplicates: true,
  });
}
