import { defineI18n } from "fumadocs-core/i18n";

/**
 * Content-side i18n (drives `source.pageTree[lang]`, `source.getPage(slug, lang)`
 * and generated doc URLs). Only `ru` is active for now — content lives at
 * `src/content/<server>/**` with no locale prefix, which fumadocs treats as
 * the default language automatically.
 *
 * To add a language later: drop its MDX files under
 * `src/content/<server>/<locale>/**`, push the code into `languages`, and
 * add it to `src/i18n/routing.ts` too.
 */
export const i18n = defineI18n({
  defaultLanguage: "ru",
  languages: ["ru", "en"],
  fallbackLanguage: "ru",
  // next-intl's routing.ts uses localePrefix: "always", so every route
  // (including the default "ru") is served under "/ru/..." or "/en/...".
  // "default-locale" would make fumadocs generate unprefixed URLs like
  // "/docs/duckburg/map" for ru, which never match the real "/ru/..."
  // pathname — breaking anything based on Fumadocs' own URL-vs-pathname
  // comparisons (e.g. the prev/next pagination footer silently rendering
  // empty on Russian pages because it can never find the current page).
  hideLocale: "never",
  // Without this, fumadocs defaults to filename-suffix locales (index.en.mdx)
  // instead of the folder convention (<locale>/index.mdx) described above.
  parser: "dir",
});
