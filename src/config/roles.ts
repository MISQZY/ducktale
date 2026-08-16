import { RESOURCE_ROLES, type ResourceRole } from "@/config/resource-roles";
import type { LocalizedName } from "@/lib/i18n-name";

export interface BuiltinRoleDefinition {
  key: string;
  name: LocalizedName;
  resourceRoles: ResourceRole[];
  /** Renaming is still allowed for a locked role — only the grant set is fixed. See Role.isLocked's doc comment in the schema. */
  isLocked?: boolean;
}

/**
 * Code-defined built-in Roles — seedBuiltinRoles() (src/lib/roles.ts)
 * upserts these by `key` on demand, but only ever creates a missing row,
 * never overwrites an existing one, so an admin's edits (names or granted
 * resource-roles, for the non-locked ones) survive redeploys. All three are
 * protected from deletion by deleteRole() (src/lib/actions/admin-roles.ts)
 * checking role.key !== null.
 *
 * - "guest" is what an unauthenticated visitor's request resolves to
 *   (getGuestResourceRoles(), src/lib/public-access.ts) — seeded with
 *   exactly the resource-roles that correspond to what's public on this
 *   site today (docs, leaderboard, public profiles, server-status), so nothing
 *   about current anonymous access changes until an admin deliberately
 *   revokes one from this Role via /admin/roles.
 * - "user" is hardcoded as the sole auto-assigned Role for every new
 *   registration (POST /api/account/register looks it up by this exact key,
 *   not via a generic "isDefault" flag any Role could carry — there's only
 *   ever one Role that should behave this way, so a per-Role toggle was
 *   redundant). Seeded with `threads-view` — the one resource-role every
 *   registered account needs to keep the site's existing "any logged-in
 *   user can use /threads" behavior unchanged now that threads-view exists
 *   at all (see RESOURCE_ROLE_ACTIONS's doc comment) — otherwise no
 *   resource-roles of its own; unlike an isLocked row, admins are free to
 *   edit its grants and inclusions from /admin/roles, since every
 *   registered account holds this Role and that's the natural place to
 *   compose real default permissions.
 * - "super-admin" (displayed as "Админ"/"Admin") is seeded with the full
 *   current RESOURCE_ROLES catalog — a ready-made "grant everything" Role,
 *   kept separate from the actual User.isAdmin superadmin bypass (that flag
 *   isn't touched by holding this Role, and isn't required to hold it
 *   either).
 */
export const BUILTIN_ROLE_DEFINITIONS: BuiltinRoleDefinition[] = [
  {
    key: "guest",
    name: { ru: "Гостевая", en: "Guest" },
    resourceRoles: ["docs-view", "leaderboard-view", "profiles-view", "server-status-view"],
  },
  {
    key: "user",
    name: { ru: "Пользователь", en: "User" },
    resourceRoles: ["threads-view"],
  },
  {
    key: "super-admin",
    name: { ru: "Админ", en: "Admin" },
    resourceRoles: [...RESOURCE_ROLES],
  },
];
