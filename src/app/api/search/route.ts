import { docsSources } from "@/lib/source";
import { SERVERS } from "@/config/servers";
import { createSearchAPI } from "fumadocs-core/search/server";

export const { GET } = createSearchAPI("advanced", {
  tokenizer: {
    language: "russian",
    normalizationCache: new Map(),
  },
  indexes: SERVERS.flatMap((s) =>
    // No lang arg = pages for all configured locales. Only `ru` exists today;
    // once another locale is added, results should probably be filtered by
    // the active UI locale here.
    docsSources[s.id as keyof typeof docsSources].getPages().map((page) => ({
      title: page.data.title ?? "",
      description: page.data.description ?? "",
      url: page.url,
      id: page.url,
      structuredData: {
        contents: [],
        headings: [],
      },
    }))
  ),
});
