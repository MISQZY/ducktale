import { loader } from "fumadocs-core/source";
import { duckburg, duckhood } from "@/.source/server";
import { SERVERS } from "@/config/servers";
import { notFound } from "next/navigation";
import { TOCItemType } from "fumadocs-core/toc";
import type { MDXContent } from "mdx/types";

const collections = {
  duckburg,
  duckhood,
} as const;

type CollectionKey = keyof typeof collections;
type Collection = (typeof collections)[CollectionKey];

function buildSource(collection: Collection, baseUrl: string) {
  return loader({
    baseUrl,
    source: collection.toFumadocsSource(),
  });
}

export type ExtendedPage = {
  title: string;
  description?: string;
  body: MDXContent;
  toc?: TOCItemType[];
  full?: boolean;
};

export const docsSources = Object.fromEntries(
  SERVERS.flatMap((s) => {
    const collection = collections[s.id as CollectionKey];
    if (!collection) {
      console.warn(
        `[source] No MDX collection found for server "${s.id}" — pages /docs/${s.id} will return 404`
      );
      return [];
    }
    return [[s.id, buildSource(collection, `/docs/${s.id}`)]];
  })
);

export function getDocsSource(id: string) {
  const src = docsSources[id as keyof typeof docsSources];
  if (!src) notFound();
  return src;
}