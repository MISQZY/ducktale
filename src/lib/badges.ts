import { siteDb } from "@/lib/site-db";
import { BADGE_DEFINITIONS } from "@/config/badges";

// Same once-per-process gate as seedBuiltinRoles (src/lib/roles.ts) — a
// createMany + skipDuplicates is cheap, but it's still a write query run
// unconditionally on every /admin/badges (and /admin/users) load forever,
// when after the first successful pass it's always a no-op.
let builtinBadgesSeeded = false;

/**
 * Ensures every code-defined badge (BADGE_DEFINITIONS) exists as a row —
 * skips any key that's already present, so it never overwrites an admin's
 * edits to a built-in badge made from /admin/badges. Idempotent (one query),
 * but only actually run once per process — see builtinBadgesSeeded above.
 */
export async function seedBuiltinBadges(): Promise<void> {
  if (builtinBadgesSeeded) return;

  await siteDb.badge.createMany({
    data: BADGE_DEFINITIONS,
    skipDuplicates: true,
  });

  builtinBadgesSeeded = true;
}

const KEY_MAX_LENGTH = 64;

/** Slugifies a badge name into a stable `key`, appending a numeric suffix on collision so admin-created badges never clash with each other or a code-defined key. */
export async function generateUniqueBadgeKey(name: string): Promise<string> {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9а-яё]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, KEY_MAX_LENGTH) || "badge";

  let key = base;
  let suffix = 2;
  while (await siteDb.badge.findUnique({ where: { key }, select: { id: true } })) {
    const suffixStr = `-${suffix}`;
    key = base.slice(0, KEY_MAX_LENGTH - suffixStr.length) + suffixStr;
    suffix++;
  }
  return key;
}
