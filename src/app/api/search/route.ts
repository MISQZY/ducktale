import { docsSources } from "@/lib/source";
import { SERVERS } from "@/config/servers";
import { createSearchAPI } from "fumadocs-core/search/server";

export const { GET } = createSearchAPI("advanced", {
  tokenizer: {
    language: "russian",
    normalizationCache: new Map(),
  },
  indexes: SERVERS.flatMap((s) =>
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
