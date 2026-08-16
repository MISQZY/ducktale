import { siteDb } from "@/lib/site-db";
import { BUILTIN_ROLE_DEFINITIONS } from "@/config/roles";
import { withCache, invalidateByPrefix } from "@/lib/query-cache";

export const EFFECTIVE_ROLES_CACHE_PREFIX = "effective-resource-roles:";
const EFFECTIVE_ROLES_CACHE_TTL_MS = 60_000;

export function invalidateEffectiveResourceRolesCache(): void {
  invalidateByPrefix(EFFECTIVE_ROLES_CACHE_PREFIX);
}

/**
 * Ensures every code-defined built-in Role (BUILTIN_ROLE_DEFINITIONS)
 * exists as a row — skips any key that's already present, so it never
 * overwrites an admin's edits (names or granted resource-roles) to a
 * built-in Role made from /admin/roles. Not a single createMany +
 * skipDuplicates like seedBuiltinBadges() — each Role needs a nested
 * RoleResourceRole write, which createMany can't express — but the list is
 * small and fixed (3 today), so a per-definition existence check is cheap
 * enough to run on every /admin/roles page load.
 */
export async function seedBuiltinRoles(): Promise<void> {
  for (const def of BUILTIN_ROLE_DEFINITIONS) {
    const exists = await siteDb.role.findUnique({ where: { key: def.key }, select: { id: true } });
    if (exists) continue;

    await siteDb.role.create({
      data: {
        key: def.key,
        name: def.name,
        isLocked: def.isLocked ?? false,
        resourceRoles: def.resourceRoles.length > 0
          ? { create: def.resourceRoles.map((resourceRole) => ({ resourceRole })) }
          : undefined,
      },
    });
  }
}

/**
 * A Role's own RoleResourceRole grants, plus every resource-role granted by
 * a RowLevelRole it pulls in (RoleRowLevelRole — flat, a RowLevelRole can't
 * itself nest further, see its doc comment in the schema), unioned with
 * everything reachable through its `includes` chain (RoleInclusion),
 * transitively — an included Role can itself include others. `visited`
 * guards against a cycle actually reaching this code at all (createRole/
 * updateRole in src/lib/actions/admin-roles.ts already reject any write
 * that would form one — that check only covers RoleInclusion, since
 * RowLevelRole can't reference a Role back, so there's no equivalent cycle
 * to guard against on that side), so this is a second line of defense, not
 * the primary one.
 *
 * One query per role encountered in the walk — fine for the small,
 * single-digit-role graphs this app has, not worth a recursive SQL CTE.
 *
 * Cached (query-cache.ts, same TTL pattern as the guest cache in
 * public-access.ts) keyed by the sorted role-id set — this is the session()
 * callback's (src/auth.ts) main DB cost, and unlike the guest path it ran
 * uncached on every authenticated navigation. Busted alongside the guest
 * cache from admin-roles.ts/admin-row-level-roles.ts whenever a Role or
 * RowLevelRole write could have changed the result.
 */
export async function resolveEffectiveResourceRoles(roleIds: string[]): Promise<Set<string>> {
  const cacheKey = EFFECTIVE_ROLES_CACHE_PREFIX + [...roleIds].sort().join(",");
  return withCache(cacheKey, EFFECTIVE_ROLES_CACHE_TTL_MS, async () => {
    const visited = new Set<string>();
    const result = new Set<string>();

    async function visit(roleId: string): Promise<void> {
      if (visited.has(roleId)) return;
      visited.add(roleId);

      const role = await siteDb.role.findUnique({
        where: { id: roleId },
        select: {
          resourceRoles: { select: { resourceRole: true } },
          includes: { select: { includedRoleId: true } },
          rowLevelRoles: { select: { rowLevelRole: { select: { resourceRoles: { select: { resourceRole: true } } } } } },
        },
      });
      if (!role) return;

      for (const rr of role.resourceRoles) result.add(rr.resourceRole);
      for (const rlr of role.rowLevelRoles) {
        for (const rr of rlr.rowLevelRole.resourceRoles) result.add(rr.resourceRole);
      }
      for (const inc of role.includes) await visit(inc.includedRoleId);
    }

    for (const roleId of roleIds) await visit(roleId);
    return result;
  });
}

/**
 * True if `includedRoleId` (or anything it transitively includes) would
 * eventually reach back to `roleId` — i.e. adding `includedRoleId` to
 * `roleId`'s `includes` would form a cycle. Checked by createRole/
 * updateRole before writing RoleInclusion rows, not just relied on at
 * resolution time.
 */
export async function wouldCreateCycle(roleId: string, includedRoleIds: string[]): Promise<boolean> {
  const visited = new Set<string>();

  async function reachesTarget(currentId: string): Promise<boolean> {
    if (currentId === roleId) return true;
    if (visited.has(currentId)) return false;
    visited.add(currentId);

    const role = await siteDb.role.findUnique({
      where: { id: currentId },
      select: { includes: { select: { includedRoleId: true } } },
    });
    if (!role) return false;

    for (const inc of role.includes) {
      if (await reachesTarget(inc.includedRoleId)) return true;
    }
    return false;
  }

  for (const includedRoleId of includedRoleIds) {
    if (includedRoleId === roleId) return true;
    if (await reachesTarget(includedRoleId)) return true;
  }
  return false;
}
