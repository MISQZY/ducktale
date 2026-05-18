import { defineDocs, defineConfig } from "fumadocs-mdx/config";

// Каждый defineDocs возвращает объект { docs, meta } — два отдельных коллектора
export const duckburg = defineDocs({
  dir: "content/duckburg",
});

export const duckhood = defineDocs({
  dir: "content/duckhood",
});

export default defineConfig();
