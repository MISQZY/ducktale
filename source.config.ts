import { defineDocs, defineConfig } from "fumadocs-mdx/config";
import { SERVERS } from "@/config/servers";

const dirs = Object.fromEntries(SERVERS.map((s) => [s.id, s.id]));

export const duckburg = defineDocs({ dir: `content/${dirs.duckburg}` });
export const duckhood = defineDocs({ dir: `content/${dirs.duckhood}` });

export default defineConfig();