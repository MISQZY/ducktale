"use server";

import { revalidatePath } from "next/cache";
import { siteDb } from "@/lib/site-db";
import { requireResourceRoleId } from "@/lib/admin";
import { SERVERS } from "@/config/servers";
import { EVENT_CATEGORIES } from "@/config/events";
import type { EventCategory } from "@/config/events";
import { isBadgeIconName } from "@/config/badges";
import type { LocalizedName } from "@/lib/i18n-name";

const NAME_MAX = 64;
const DESCRIPTION_MAX = 500;

interface EventFields {
  serverId: string | null;
  icon: string;
  category: EventCategory;
  name: LocalizedName;
  description: LocalizedName;
  startAt: Date;
  endAt: Date;
  href: string | null;
}

function readEventFields(formData: FormData): EventFields {
  // Empty/"none" -> network-wide event, not tied to one server.
  const serverIdRaw = (formData.get("serverId") as string | null)?.trim() ?? "";
  if (serverIdRaw && !SERVERS.some((s) => s.id === serverIdRaw)) throw new Error("Unknown server");
  const serverId = serverIdRaw || null;

  const icon = (formData.get("icon") as string | null)?.trim() ?? "";
  if (!icon || !isBadgeIconName(icon)) throw new Error("Unknown icon");

  const category = (formData.get("category") as string | null)?.trim() ?? "";
  if (!EVENT_CATEGORIES.includes(category as EventCategory)) throw new Error("Unknown category");

  const nameRu = (formData.get("nameRu") as string | null)?.trim().slice(0, NAME_MAX) ?? "";
  if (!nameRu) throw new Error("Russian name is required");
  const nameEn = (formData.get("nameEn") as string | null)?.trim().slice(0, NAME_MAX) ?? "";
  if (!nameEn) throw new Error("English name is required");

  const descriptionRu = (formData.get("descriptionRu") as string | null)?.trim().slice(0, DESCRIPTION_MAX) ?? "";
  if (!descriptionRu) throw new Error("Russian description is required");
  const descriptionEn = (formData.get("descriptionEn") as string | null)?.trim().slice(0, DESCRIPTION_MAX) ?? "";
  if (!descriptionEn) throw new Error("English description is required");

  const startAtRaw = (formData.get("startAt") as string | null) ?? "";
  const endAtRaw = (formData.get("endAt") as string | null) ?? "";
  const startAt = new Date(startAtRaw);
  const endAt = new Date(endAtRaw);
  if (Number.isNaN(startAt.getTime())) throw new Error("Start date is required");
  if (Number.isNaN(endAt.getTime())) throw new Error("End date is required");
  if (endAt.getTime() < startAt.getTime()) throw new Error("End date must not be before start date");

  const hrefRaw = (formData.get("href") as string | null)?.trim() ?? "";
  if (hrefRaw && !/^https?:\/\//i.test(hrefRaw)) throw new Error("Link must start with http:// or https://");

  return {
    serverId,
    icon,
    category: category as EventCategory,
    name: { ru: nameRu, en: nameEn },
    description: { ru: descriptionRu, en: descriptionEn },
    startAt,
    endAt,
    href: hrefRaw || null,
  };
}

export async function createServerEvent(lang: string, formData: FormData): Promise<void> {
  await requireResourceRoleId("events-edit");
  const fields = readEventFields(formData);

  await siteDb.serverEvent.create({ data: fields });

  revalidatePath(`/${lang}/admin/events`);
  revalidatePath(`/${lang}/events`);
}

export async function updateServerEvent(lang: string, eventId: string, formData: FormData): Promise<void> {
  await requireResourceRoleId("events-edit");
  const fields = readEventFields(formData);

  await siteDb.serverEvent.update({ where: { id: eventId }, data: fields });

  revalidatePath(`/${lang}/admin/events`);
  revalidatePath(`/${lang}/events`);
}

export async function deleteServerEvent(lang: string, eventId: string): Promise<void> {
  await requireResourceRoleId("events-delete");

  await siteDb.serverEvent.delete({ where: { id: eventId } });

  revalidatePath(`/${lang}/admin/events`);
  revalidatePath(`/${lang}/events`);
}
