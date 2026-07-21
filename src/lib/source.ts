import { duckburgDocs, duckhoodDocs } from "fumadocs-mdx:collections/server";
import { type InferPageType, loader, type LoaderOutput } from "fumadocs-core/source";
import { lucideIconsPlugin } from "fumadocs-core/source/lucide-icons";
import { icons } from "lucide-react";
import { createElement } from "react";

function iconResolver(icon?: string) {
  if (!icon) return;
  if (icon in icons) return createElement(icons[icon as keyof typeof icons]);
}

/**
 * Each Minecraft server has its own docs collection (see source.config.ts),
 * so it gets its own fumadocs loader here too. Keys must match `SERVERS[].id`
 * in `src/config/servers.ts`.
 */
export const docsSources = {
  duckburg: loader({
    icon: iconResolver,
    baseUrl: "/docs/duckburg",
    source: duckburgDocs.toFumadocsSource(),
    plugins: [lucideIconsPlugin()],
  }),
  duckhood: loader({
    icon: iconResolver,
    baseUrl: "/docs/duckhood",
    source: duckhoodDocs.toFumadocsSource(),
    plugins: [lucideIconsPlugin()],
  }),
};

export type DocsSource = LoaderOutput<{
  meta: (typeof docsSources)["duckburg"]["$infer"]["meta"];
  page: (typeof docsSources)["duckburg"]["$infer"]["page"];
  i18n: undefined;
}>;

export function getDocsSource(serverId: string) {
  return docsSources[serverId as keyof typeof docsSources];
}

export function getPageImage(
  serverId: string,
  page: InferPageType<(typeof docsSources)[keyof typeof docsSources]>
) {
  const segments = [serverId, ...page.slugs, "image.webp"];

  return {
    segments,
    url: `https://flectone.net/og/docs/${segments.join("/")}`,
  };
}
