import { loader, map } from "fumadocs-core/source";
import { duckburg, duckhood } from "@/.source";
import { z } from "zod";

const pageSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  full: z.boolean().optional(),
  toc: z.any().optional(),
  body: z.any().optional(),
});

type ExtendedPage = z.infer<typeof pageSchema>;

function makeSource(collection: typeof duckburg) {
  const raw = collection.toFumadocsSource();
  const files = (raw.files as any)();
  return map({ files } as any).page((entry) => ({
    ...entry,
    data: entry.data as ExtendedPage,
  }));
}

export const duckburgSource = loader({
  baseUrl: "/docs/duckburg",
  source: makeSource(duckburg),
});

export const duckhoodSource = loader({
  baseUrl: "/docs/duckhood",
  source: makeSource(duckhood),
});