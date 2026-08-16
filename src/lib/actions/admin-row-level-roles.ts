"use server";

import { revalidatePath } from "next/cache";
import { siteDb } from "@/lib/site-db";
import { requireResourceRoleId } from "@/lib/admin";
import { isResourceRole } from "@/config/resource-roles";
import { invalidateGuestResourceRolesCache } from "@/lib/public-access";
import { invalidateEffectiveResourceRolesCache } from "@/lib/roles";
import type { LocalizedName } from "@/lib/i18n-name";

const NAME_MAX = 64;

interface RowLevelRoleFields {
  name: LocalizedName;
  resourceRoles: string[];
}

/** Same shape as admin-roles.ts's readRoleFields, minus includedRoleIds — a RowLevelRole is a flat bundle of resource-roles, see RowLevelRole's doc comment in the schema. */
function readRowLevelRoleFields(formData: FormData): RowLevelRoleFields {
  const ru = (formData.get("nameRu") as string | null)?.trim().slice(0, NAME_MAX) ?? "";
  if (!ru) throw new Error("Russian name is required");
  const en = (formData.get("nameEn") as string | null)?.trim().slice(0, NAME_MAX) ?? "";
  if (!en) throw new Error("English name is required");

  const resourceRoles = [...new Set(formData.getAll("resourceRoles").map((v) => String(v).trim()).filter(Boolean))];
  for (const role of resourceRoles) {
    if (!isResourceRole(role)) throw new Error(`Unknown resource-role: ${role}`);
  }

  return { name: { ru, en }, resourceRoles };
}

export async function createRowLevelRole(lang: string, formData: FormData): Promise<void> {
  await requireResourceRoleId("row-level-roles-edit");

  const { name, resourceRoles } = readRowLevelRoleFields(formData);
  await siteDb.rowLevelRole.create({
    data: {
      name,
      resourceRoles: resourceRoles.length > 0 ? { create: resourceRoles.map((resourceRole) => ({ resourceRole })) } : undefined,
    },
  });

  revalidatePath(`/${lang}/admin/row-level-roles`);
}

export async function updateRowLevelRole(lang: string, rowLevelRoleId: string, formData: FormData): Promise<void> {
  await requireResourceRoleId("row-level-roles-edit");

  const existing = await siteDb.rowLevelRole.findUnique({ where: { id: rowLevelRoleId }, select: { id: true } });
  if (!existing) throw new Error("Row-level role not found");

  const { name, resourceRoles } = readRowLevelRoleFields(formData);

  // resourceRoles is a join table, not a direct many-to-many — "replace the
  // set" means delete-then-recreate the link rows, same as updateRole()
  // does for RoleResourceRole.
  await siteDb.$transaction([
    siteDb.rowLevelRole.update({ where: { id: rowLevelRoleId }, data: { name } }),
    siteDb.rowLevelRoleResourceRole.deleteMany({ where: { rowLevelRoleId } }),
    ...(resourceRoles.length > 0
      ? [siteDb.rowLevelRoleResourceRole.createMany({ data: resourceRoles.map((resourceRole) => ({ rowLevelRoleId, resourceRole })) })]
      : []),
  ]);

  // Cheap and safe to run unconditionally rather than figuring out whether
  // this specific RowLevelRole sits in "guest"'s effective grants via some
  // Role that pulls it in — same tradeoff updateRole() makes.
  invalidateGuestResourceRolesCache();
  invalidateEffectiveResourceRolesCache();
  revalidatePath(`/${lang}/admin/row-level-roles`);
  revalidatePath(`/${lang}/admin/roles`);
}

export async function deleteRowLevelRole(lang: string, rowLevelRoleId: string): Promise<void> {
  await requireResourceRoleId("row-level-roles-delete");

  // RowLevelRoleResourceRole/RoleRowLevelRole rows are onDelete: Cascade, so
  // this also drops it from every Role that was pulling it in.
  await siteDb.rowLevelRole.delete({ where: { id: rowLevelRoleId } });

  invalidateGuestResourceRolesCache();
  invalidateEffectiveResourceRolesCache();
  revalidatePath(`/${lang}/admin/row-level-roles`);
  revalidatePath(`/${lang}/admin/roles`);
}
