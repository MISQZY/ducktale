import { defineDocs, defineConfig } from "fumadocs-mdx/config";
import lastModified from 'fumadocs-mdx/plugins/last-modified';
import { z } from 'zod';

const pageSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  icon: z.string().optional(),
  authors: z.array(z.string()).optional(),
  tag: z.string().optional(),
});

// Each Minecraft server gets its own docs collection, rooted at
// `src/content/<serverId>`. Keep the ids in sync with `SERVERS` in
// `src/config/servers.ts`.
export const duckburgDocs = defineDocs({
  dir: './src/content/duckburg',
  docs: { schema: pageSchema },
});

export const duckhoodDocs = defineDocs({
  dir: './src/content/duckhood',
  docs: { schema: pageSchema },
});

export default defineConfig({
  plugins: [lastModified()],
});
