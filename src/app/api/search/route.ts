import { docsSources } from "@/lib/source";
import { SERVERS } from "@/config/servers";
import { createSearchAPI } from "fumadocs-core/search/server";
import { Page, PageData } from "fumadocs-core/source";

export const { GET } = createSearchAPI("advanced", {
  tokenizer: {
    language: "russian",
    normalizationCache: new Map(),
  },
  indexes: SERVERS.flatMap((s) =>
    docsSources[s.id].getPages().map((page: Page<PageData>) => ({
      title: page.data.title ?? "",
      description: page.data.description ?? "",
      url: page.url,
      id: page.url,
      structuredData: (page.data as Record<string, unknown>)["structuredData"] as {
        contents: { heading: string; content: string }[];
        headings: { id: string; content: string; depth: number }[];
      } ?? { contents: [], headings: [] },
    }))
  ),
});