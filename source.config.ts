import { defineDocs, defineConfig } from "fumadocs-mdx/config";

export const duckburg = defineDocs({ dir: "content/duckburg" });
export const duckhood = defineDocs({ dir: "content/duckhood" });

export default defineConfig();