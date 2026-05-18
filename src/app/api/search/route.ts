import { duckburgSource, duckhoodSource } from "@/lib/source";
import { createSearchAPI } from "fumadocs-core/search/server";

export const { GET } = createSearchAPI("advanced", {
  tokenizer: {
    language: "russian",
    normalizationCache: new Map(),
  },
  indexes: [
    ...duckburgSource.getPages().map((page) => ({
      title: page.data.title ?? "",
      description: page.data.description ?? "",
      url: page.url,
      id: page.url,
      structuredData: (page as any).data.structuredData ?? { contents: [] },
    })),
    ...duckhoodSource.getPages().map((page) => ({
      title: page.data.title ?? "",
      description: page.data.description ?? "",
      url: page.url,
      id: page.url,
      structuredData: (page as any).data.structuredData ?? { contents: [] },
    })),
  ],
});