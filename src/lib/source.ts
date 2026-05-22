import { loader } from "fumadocs-core/source";
import { duckburg, duckhood } from "@/../.source";
import { SERVERS } from "@/config/servers";
import { ComponentType } from "react";
import type { MDXComponents } from "mdx/types";
import type { VirtualFile, SourceConfig } from 'fumadocs-core/source';
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

export const docsSources = Object.fromEntries(
  SERVERS.map((s) => [
    s.id,
    (() => {
      const src = collections[s.id].toFumadocsSource();
      return loader({
        baseUrl: `/docs/${s.id}`,
        source: {
          ...src,
          files: typeof src.files === 'function'
            ? (src.files as () => VirtualFile<SourceConfig>[] )()
            : (src.files as VirtualFile<SourceConfig>[]),
        },
      });
    })(),
  ])
) as Record<string, ReturnType<typeof loader>>;

export function getDocsSource(id: string) {
  const src = docsSources[id];
  if (!src) notFound();
  return src;
}