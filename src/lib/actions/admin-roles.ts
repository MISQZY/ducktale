"use server";

import { revalidatePath } from "next/cache";
import { siteDb } from "@/lib/site-db";
import { requireResourceRoleId } from "@/lib/admin";
import { isResourceRole } from "@/config/resource-roles";
import { wouldCreateCycle, invalidateEffectiveResourceRolesCache } from "@/lib/roles";
import { invalidateGuestResourceRolesCache } from "@/lib/public-access";
import type { LocalizedName } from "@/lib/i18n-name";

const NAME_MAX = 64;
const SEARCH_LIMIT = 20;

interface RoleFields {
  name: LocalizedName;
  resourceRoles: string[];
  includedRoleIds: string[];
  rowLevelRoleIds: string[];
}

/**
 * A role can grant any number of resource-roles (src/config/resource-roles.ts),
 * include any number of other Roles, and pull in any number of RowLevelRoles
 * (src/lib/actions/admin-row-level-roles.ts) — <input type=hidden> per
 * selection for all three, same pattern BadgeFormDialog uses for
 * autoRoleIds. The form still submits nameRu/nameEn as two separate text
 * inputs (editing convenience) — only the DB storage is the combined
 * LocalizedName JSON.
 */
function readRoleFields(formData: FormData): RoleFields {
  const ru = (formData.get("nameRu") as string | null)?.trim().slice(0, NAME_MAX) ?? "";
  if (!ru) throw new Error("Russian name is required");
  const en = (formData.get("nameEn") as string | null)?.trim().slice(0, NAME_MAX) ?? "";
  if (!en) throw new Error("English name is required");

  const resourceRoles = [...new Set(formData.getAll("resourceRoles").map((v) => String(v).trim()).filter(Boolean))];
  for (const role of resourceRoles) {
    if (!isResourceRole(role)) throw new Error(`Unknown resource-role: ${role}`);
  }

  const includedRoleIds = [...new Set(formData.getAll("includedRoleIds").map((v) => String(v).trim()).filter(Boolean))];
  const rowLevelRoleIds = [...new Set(formData.getAll("rowLevelRoleIds").map((v) => String(v).trim()).filter(Boolean))];

  return { name: { ru, en }, resourceRoles, includedRoleIds, rowLevelRoleIds };
}

export async function createRole(lang: string, formData: FormData): Promise<void> {
  await requireResourceRoleId("role-edit");

  const { name, resourceRoles, includedRoleIds, rowLevelRoleIds } = readRoleFields(formData);
  const created = await siteDb.role.create({
    data: {
      name,
      resourceRoles: resourceRoles.length > 0 ? { create: resourceRoles.map((resourceRole) => ({ resourceRole })) } : undefined,
      rowLevelRoles: rowLevelRoleIds.length > 0 ? { create: rowLevelRoleIds.map((rowLevelRoleId) => ({ rowLevelRoleId })) } : undefined,
    },
    select: { id: true },
  });
  const roleId = created.id;

  // A brand-new role can't already be reachable from anything (nothing
  // pointed at it before this request existed), so the only cycle to check
  // is direct/transitive self-inclusion through what was just submitted.
  // RowLevelRole can't reference a Role back (see its doc comment in the
  // schema), so there's no equivalent cycle to check on that side.
  if (includedRoleIds.length > 0) {
    if (await wouldCreateCycle(roleId, includedRoleIds)) {
      await siteDb.role.delete({ where: { id: roleId } });
      throw new Error("That would create a cycle of roles including each other");
    }
    await siteDb.roleInclusion.createMany({ data: includedRoleIds.map((includedRoleId) => ({ roleId, includedRoleId })) });
  }

  revalidatePath(`/${lang}/admin/roles`);
}

export async function updateRole(lang: string, roleId: string, formData: FormData): Promise<void> {
  await requireResourceRoleId("role-edit");

  const existing = await siteDb.role.findUnique({ where: { id: roleId }, select: { isLocked: true } });
  if (!existing) throw new Error("Role not found");

  const { name, resourceRoles, includedRoleIds, rowLevelRoleIds } = readRoleFields(formData);

  // A locked role only allows renaming — grants/inclusions are fixed by
  // design, not just hidden in the UI (RoleFormDialog doesn't even render
  // those fields for a locked role, but this is the actual enforcement
  // point).
  if (existing.isLocked) {
    await siteDb.role.update({ where: { id: roleId }, data: { name } });
    revalidatePath(`/${lang}/admin/roles`);
    return;
  }

  if (includedRoleIds.length > 0 && (await wouldCreateCycle(roleId, includedRoleIds))) {
    throw new Error("That would create a cycle of roles including each other");
  }

  // resourceRoles/includedRoleIds/rowLevelRoleIds are all join tables, not
  // direct many-to-many — "replace the set" means delete-then-recreate the
  // link rows, same as updateBadge() does for BadgeAutoRole.
  await siteDb.$transaction([
    siteDb.role.update({ where: { id: roleId }, data: { name } }),
    siteDb.roleResourceRole.deleteMany({ where: { roleId } }),
    ...(resourceRoles.length > 0
      ? [siteDb.roleResourceRole.createMany({ data: resourceRoles.map((resourceRole) => ({ roleId, resourceRole })) })]
      : []),
    siteDb.roleInclusion.deleteMany({ where: { roleId } }),
    ...(includedRoleIds.length > 0
      ? [siteDb.roleInclusion.createMany({ data: includedRoleIds.map((includedRoleId) => ({ roleId, includedRoleId })) })]
      : []),
    siteDb.roleRowLevelRole.deleteMany({ where: { roleId } }),
    ...(rowLevelRoleIds.length > 0
      ? [siteDb.roleRowLevelRole.createMany({ data: rowLevelRoleIds.map((rowLevelRoleId) => ({ roleId, rowLevelRoleId })) })]
      : []),
  ]);

  // Cheap and safe to run unconditionally rather than figuring out whether
  // this specific role sits in "guest"'s inclusion chain — a stale Guest
  // cache lingering for up to 60s on every Role edit isn't worth the extra
  // bookkeeping to avoid.
  invalidateGuestResourceRolesCache();
  invalidateEffectiveResourceRolesCache();
  revalidatePath(`/${lang}/admin/roles`);
}

export async function deleteRole(lang: string, roleId: string): Promise<void> {
  await requireResourceRoleId("role-delete");

  // Built-in roles (key !== null — "guest"/"user"/"super-admin",
  // src/config/roles.ts) are protected from deletion so they can't be lost
  // by accident; their names/grants/inclusions otherwise stay
  // admin-editable (unless isLocked too — see updateRole). Checked
  // server-side, not just hidden in the UI (RoleRowActions).
  const role = await siteDb.role.findUnique({ where: { id: roleId }, select: { key: true } });
  if (!role) throw new Error("Role not found");
  if (role.key !== null) throw new Error("Built-in roles can't be deleted");

  // RoleResourceRole/UserRole/RoleInclusion (both directions) rows for this
  // role are onDelete: Cascade, so this drops its grants, every user's
  // assignment, and its place in any other role's inclusion chain in one go.
  await siteDb.role.delete({ where: { id: roleId } });

  invalidateGuestResourceRolesCache();
  invalidateEffectiveResourceRolesCache();
  revalidatePath(`/${lang}/admin/roles`);
}

export interface RoleUser {
  userId: string;
  nickname: string;
  skinUrl: string | null;
  linked: boolean;
  assignedAt: Date;
}

export async function getRoleUsers(roleId: string): Promise<RoleUser[]> {
  await requireResourceRoleId("role-view");

  const rows = await siteDb.userRole.findMany({
    where: { roleId },
    orderBy: { assignedAt: "asc" },
    select: {
      assignedAt: true,
      user: { select: { id: true, nickname: true, accountLink: { select: { status: true, minecraftUuid: true } } } },
    },
  });

  const { resolveSkinUrls } = await import("@/lib/skin");
  const skinUrls = await resolveSkinUrls(
    rows.map((r) => (r.user.accountLink?.status === "CONFIRMED" ? r.user.accountLink.minecraftUuid : null))
  );

  return rows.map((r, i) => ({
    userId: r.user.id,
    nickname: r.user.nickname,
    skinUrl: skinUrls[i],
    linked: r.user.accountLink?.status === "CONFIRMED",
    assignedAt: r.assignedAt,
  }));
}

/**
 * "Гостевая" (key: "guest") exists purely as the resolution target for
 * *anonymous* (no-session) requests (getGuestResourceRoles(), src/lib/
 * public-access.ts) — it was never meant to be held by a real, logged-in
 * User. A logged-in account keeps every login-gated capability (creating a
 * thread, replying to a ticket, ...) regardless of which resource-roles it
 * holds, since those checks are "is there a session" (getSiteViewer), not
 * resource-role checks — so assigning "Гостевая" to a real user doesn't
 * actually restrict them the way an admin would expect, it just silently
 * does nothing. Rejected here rather than only hidden from the picker UI.
 */
async function assertAssignableToUser(roleId: string): Promise<void> {
  const role = await siteDb.role.findUnique({ where: { id: roleId }, select: { key: true } });
  if (role?.key === "guest") {
    throw new Error('The "Гостевая" role can\'t be assigned to a user — it only applies to anonymous visitors');
  }
}

export async function assignUserToRole(lang: string, userId: string, roleId: string): Promise<void> {
  await requireResourceRoleId("role-edit");
  await assertAssignableToUser(roleId);

  // upsert (not create) — re-assigning a role a user already holds is a
  // harmless no-op rather than a unique-constraint error, same pattern as
  // awardBadge().
  await siteDb.userRole.upsert({
    where: { userId_roleId: { userId, roleId } },
    create: { userId, roleId },
    update: {},
  });

  revalidatePath(`/${lang}/admin/roles`);
}

export async function removeUserFromRole(lang: string, userId: string, roleId: string): Promise<void> {
  await requireResourceRoleId("role-edit");

  await siteDb.userRole.deleteMany({ where: { userId, roleId } });

  revalidatePath(`/${lang}/admin/roles`);
}

/**
 * Replaces a user's entire Role set in one go — used by AdminUserEditDialog's
 * unified Save button (roles are staged alongside the nickname there, not
 * persisted per-checkbox like RoleUsersDialog's assign/revoke). Every user
 * must hold at least one Role (so a fully-unassigned account never exists) —
 * an empty selection falls back to the built-in "user" Role, the same one
 * every registration auto-gets (src/config/roles.ts), rather than being
 * rejected outright. Not "guest" — see assertAssignableToUser's doc comment
 * for why that one specifically can't be held by a real account. Returns the
 * Role ids actually persisted so the caller's local state can reflect the
 * fallback without waiting on a revalidation round-trip.
 */
export async function setUserRoles(lang: string, userId: string, roleIds: string[]): Promise<string[]> {
  await requireResourceRoleId("role-edit");

  let finalRoleIds = [...new Set(roleIds)];
  await Promise.all(finalRoleIds.map(assertAssignableToUser));

  if (finalRoleIds.length === 0) {
    const fallback = await siteDb.role.findUnique({ where: { key: "user" }, select: { id: true } });
    if (fallback) finalRoleIds = [fallback.id];
  }

  await siteDb.$transaction([
    siteDb.userRole.deleteMany({ where: { userId } }),
    ...(finalRoleIds.length > 0
      ? [siteDb.userRole.createMany({ data: finalRoleIds.map((roleId) => ({ userId, roleId })) })]
      : []),
  ]);

  revalidatePath(`/${lang}/admin/roles`);
  revalidatePath(`/${lang}/admin/users`);
  return finalRoleIds;
}

export interface AssignableUser {
  userId: string;
  nickname: string;
  skinUrl: string | null;
  linked: boolean;
}

/** Site users matching `query` by nickname, for the "assign this role to a user" search — not scoped to current holders, so the admin can grant a role to anyone. */
export async function searchAssignableUsers(query: string): Promise<AssignableUser[]> {
  await requireResourceRoleId("role-edit");

  const cleanQuery = query.trim();
  const users = await siteDb.user.findMany({
    // Relies on the site DB's case-insensitive collation (same as elsewhere
    // in this codebase) — no explicit `mode: "insensitive"` needed.
    where: cleanQuery ? { nickname: { contains: cleanQuery } } : undefined,
    orderBy: { nickname: "asc" },
    take: SEARCH_LIMIT,
    select: { id: true, nickname: true, accountLink: { select: { status: true, minecraftUuid: true } } },
  });

  const { resolveSkinUrls } = await import("@/lib/skin");
  const skinUrls = await resolveSkinUrls(
    users.map((u) => (u.accountLink?.status === "CONFIRMED" ? u.accountLink.minecraftUuid : null))
  );

  return users.map((u, i) => ({
    userId: u.id,
    nickname: u.nickname,
    skinUrl: skinUrls[i],
    linked: u.accountLink?.status === "CONFIRMED",
  }));
}
