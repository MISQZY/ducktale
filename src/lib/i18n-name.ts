/**
 * Shape stored in every bilingual `name: Json` column (Role, ResourceRoleLabel)
 * — matches routing.ts's locales list. Validated at the app layer wherever
 * it's written (both keys required), not DB-enforced.
 */
export interface LocalizedName {
  ru: string;
  en: string;
  // Index signature so this satisfies Prisma's InputJsonValue when written
  // straight into a `Json` column (siteDb.role.create/update, etc.) without
  // a cast at every write site.
  [key: string]: string;
}

export function localizedName(name: LocalizedName, lang: string): string {
  return lang === "ru" ? name.ru : name.en;
}
