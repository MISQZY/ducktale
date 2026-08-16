"use server";

import { revalidatePath } from "next/cache";
import { siteDb } from "@/lib/site-db";
import { requireResourceRoleId } from "@/lib/admin";
import { SERVERS } from "@/config/servers";
import type { LocalizedName } from "@/lib/i18n-name";

const NAME_MAX = 64;

interface MapFields {
  serverId: string;
  name: LocalizedName;
  url: string;
}

function readMapFields(formData: FormData): MapFields {
  const serverId = (formData.get("serverId") as string | null)?.trim() ?? "";
  if (!SERVERS.some((s) => s.id === serverId)) throw new Error("Unknown server");

  const ru = (formData.get("nameRu") as string | null)?.trim().slice(0, NAME_MAX) ?? "";
  if (!ru) throw new Error("Russian name is required");
  const en = (formData.get("nameEn") as string | null)?.trim().slice(0, NAME_MAX) ?? "";
  if (!en) throw new Error("English name is required");

  const url = (formData.get("url") as string | null)?.trim() ?? "";
  if (!/^https?:\/\//i.test(url)) throw new Error("Map link must start with http:// or https://");

  return { serverId, name: { ru, en }, url };
}

export async function createServerMap(lang: string, formData: FormData): Promise<void> {
  await requireResourceRoleId("maps-edit");
  const fields = readMapFields(formData);

  await siteDb.serverMap.create({ data: fields });

  revalidatePath(`/${lang}/admin/maps`);
  revalidatePath(`/${lang}/maps/${fields.serverId}`);
}

export async function updateServerMap(lang: string, mapId: string, formData: FormData): Promise<void> {
  await requireResourceRoleId("maps-edit");
  const fields = readMapFields(formData);

  await siteDb.serverMap.update({ where: { id: mapId }, data: fields });

  revalidatePath(`/${lang}/admin/maps`);
  revalidatePath(`/${lang}/maps/${fields.serverId}`);
  revalidatePath(`/${lang}/maps/${fields.serverId}/${mapId}`);
}

export async function deleteServerMap(lang: string, mapId: string): Promise<void> {
  await requireResourceRoleId("maps-delete");

  const map = await siteDb.serverMap.delete({ where: { id: mapId }, select: { serverId: true } });

  revalidatePath(`/${lang}/admin/maps`);
  revalidatePath(`/${lang}/maps/${map.serverId}`);
}
