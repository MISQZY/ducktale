import { loader } from "fumadocs-core/source";
import { duckburg, duckhood } from "@/../.source";
import { SERVERS } from "@/config/servers";
import { ComponentType } from "react";
import type { MDXComponents } from "mdx/types";
import type { VirtualFile, SourceConfig } from "fumadocs-core/source";
import { notFound } from "next/navigation";

export interface ExtendedPage {
  title: string;
  description?: string;
  full?: boolean;
  toc?: unknown;
  body?: ComponentType<{ components: MDXComponents }>;
}

type FumadocsCollection = typeof duckburg;

const collections: Record<string, FumadocsCollection> = { duckburg, duckhood };

function buildSource(collection: FumadocsCollection, baseUrl: string) {
  const src = collection.toFumadocsSource();
  return loader({
    baseUrl,
    source: {
      ...src,
      files: typeof src.files === "function"
        ? (src.files as () => VirtualFile<SourceConfig>[])()
        : (src.files as VirtualFile<SourceConfig>[]),
    },
  });
}

export const docsSources = Object.fromEntries(
  SERVERS.flatMap((s) => {
    const collection = collections[s.id];
    if (!collection) {
      console.warn(`[source] No MDX collection found for server "${s.id}" — pages /docs/${s.id} will return 404`);
      return [];
    }
    return [[s.id, buildSource(collection, `/docs/${s.id}`)]];
  })
) as Record<string, ReturnType<typeof loader>>;

export function getDocsSource(id: string) {
  const src = docsSources[id];
  if (!src) notFound();
  return src;
}