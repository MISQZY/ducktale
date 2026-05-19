import { loader, map } from "fumadocs-core/source";
import { duckburg, duckhood } from "@/../.source";
import { SERVERS } from "@/config/servers";
import { z } from "zod";
import { ComponentType } from "react";
import type { MDXComponents } from "mdx/types";

const pageSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  full: z.boolean().optional(),
  toc: z.any().optional(),
  body: z.custom<ComponentType<{ components: MDXComponents }>>(),
});

export type ExtendedPage = z.infer<typeof pageSchema>;

function makeSource(collection: typeof duckburg) {
  const raw = collection.toFumadocsSource();
  const files = (raw.files as any)();
  return map({ files } as any).page((entry) => ({
    ...entry,
    data: entry.data as ExtendedPage,
  }));
}

const collections: Record<string, typeof duckburg> = { duckburg, duckhood };

export const docsSources = Object.fromEntries(
  SERVERS.map((s) => [
    s.id,
    loader({
      baseUrl: `/docs/${s.id}`,
      source: makeSource(collections[s.id]),
    }),
  ])
);

export function getDocsSource(id: string) {
  const src = docsSources[id];
  if (!src) throw new Error(`Unknown docs source: "${id}"`);
  return src;
}