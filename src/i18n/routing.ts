import { defineRouting } from "next-intl/routing";

/**
 * Site-wide routing i18n. Only `ru` is active right now, so URLs are
 * unchanged (no "/ru/..." prefix). `localePrefix: "as-needed"` means the
 * default locale stays unprefixed and any future locale added to `locales`
 * automatically gets its own "/xx/..." prefix — no existing links break.
 */
export const routing = defineRouting({
  locales: ["ru", "en"],
  defaultLocale: "ru",
  localePrefix: "always",
});
