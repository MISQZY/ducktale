import { siteDb } from "@/lib/site-db";
import { RESOURCE_ROLE_ACTIONS, type Resource } from "@/config/resource-roles";
import type { LocalizedName } from "@/lib/i18n-name";
import ruMessages from "@/i18n/messages/ru.json";
import enMessages from "@/i18n/messages/en.json";

export type ResourceLabelMap = Record<Resource, LocalizedName>;

// Read directly from the message JSON (not next-intl's per-request
// getTranslations/useTranslations) specifically to get BOTH locales'
// defaults regardless of which one the current admin happens to be
// viewing in — an override edit form needs to pre-fill ru and en at once.
const RU_DEFAULTS = ruMessages.Admin.resourceRoles.resourceLabels as Record<string, string>;
const EN_DEFAULTS = enMessages.Admin.resourceRoles.resourceLabels as Record<string, string>;

/**
 * Every resource's effective display name — an admin override
 * (ResourceRoleLabel, keyed by resource, e.g. "tickets") if one exists,
 * else the code-defined i18n default. Used wherever a resource-role gets
 * shown to an admin: its own reference page (/admin/resource-roles), the
 * Role-builder picker, and a Role's grants column (all on /admin/roles).
 */
export async function getResourceLabels(): Promise<ResourceLabelMap> {
  const overrides = await siteDb.resourceRoleLabel.findMany();
  const overrideByResource = new Map(overrides.map((o) => [o.resource, o.name as unknown as LocalizedName]));

  const result = {} as ResourceLabelMap;
  for (const resource of Object.keys(RESOURCE_ROLE_ACTIONS) as Resource[]) {
    const override = overrideByResource.get(resource);
    result[resource] = {
      ru: override?.ru ?? RU_DEFAULTS[resource] ?? resource,
      en: override?.en ?? EN_DEFAULTS[resource] ?? resource,
    };
  }
  return result;
}
