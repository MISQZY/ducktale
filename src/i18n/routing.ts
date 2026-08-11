import { defineRouting } from "next-intl/routing";

/**
 * Site-wide routing i18n. `localePrefix: "always"` means every URL,
 * including the default `ru` locale, is prefixed ("/ru/...", "/en/...").
 */
export const routing = defineRouting({
  locales: ["ru", "en"],
  defaultLocale: "ru",
  localePrefix: "always",
});
