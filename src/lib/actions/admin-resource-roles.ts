"use server";

import { revalidatePath } from "next/cache";
import { siteDb } from "@/lib/site-db";
import { requireResourceRoleId } from "@/lib/admin";
import { isResource, type Resource } from "@/config/resource-roles";

const NAME_MAX = 64;

/** Overrides the display name shown for `resource` (both locales at once — see ResourceRoleLabel's doc comment in the schema for why it's keyed one level up from the individual resource-role). */
export async function upsertResourceLabel(lang: string, resource: Resource, formData: FormData): Promise<void> {
  await requireResourceRoleId("resource-roles-edit");
  if (!isResource(resource)) throw new Error("Unknown resource");

  const ru = (formData.get("nameRu") as string | null)?.trim().slice(0, NAME_MAX) ?? "";
  if (!ru) throw new Error("Russian name is required");
  const en = (formData.get("nameEn") as string | null)?.trim().slice(0, NAME_MAX) ?? "";
  if (!en) throw new Error("English name is required");

  const name = { ru, en };
  await siteDb.resourceRoleLabel.upsert({
    where: { resource },
    create: { resource, name },
    update: { name },
  });

  revalidatePath(`/${lang}/admin/resource-roles`);
  revalidatePath(`/${lang}/admin/roles`);
}

/** Drops the override for `resource`, reverting its display name back to the code-defined i18n default. */
export async function resetResourceLabel(lang: string, resource: Resource): Promise<void> {
  await requireResourceRoleId("resource-roles-edit");
  if (!isResource(resource)) throw new Error("Unknown resource");

  await siteDb.resourceRoleLabel.deleteMany({ where: { resource } });

  revalidatePath(`/${lang}/admin/resource-roles`);
  revalidatePath(`/${lang}/admin/roles`);
}
