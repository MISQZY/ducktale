import { readdir, readFile } from "fs/promises";
import path from "path";
import type { ContentFileEntry } from "@/lib/content-tree";

const CONTENT_DIR_NAME = "src/content";
const CONTENT_ROOT = path.join(process.cwd(), CONTENT_DIR_NAME);

async function walk(dir: string, out: ContentFileEntry[]): Promise<void> {
  const items = await readdir(dir, { withFileTypes: true });
  for (const item of items) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      await walk(full, out);
    } else if (item.isFile() && item.name.endsWith(".mdx")) {
      const relFromContent = path.relative(CONTENT_ROOT, full).split(path.sep).join("/");
      const [server, lang, ...rest] = relFromContent.split("/");
      out.push({
        relPath: `${CONTENT_DIR_NAME}/${relFromContent}`,
        server,
        lang,
        slug: rest.join("/"),
      });
    }
  }
}

/** Every editable .mdx file under src/content, discovered fresh from disk (not cached, so newly added files show up without a restart). */
export async function listContentFiles(): Promise<ContentFileEntry[]> {
  const out: ContentFileEntry[] = [];
  await walk(CONTENT_ROOT, out);
  out.sort((a, b) => a.relPath.localeCompare(b.relPath));
  return out;
}

export async function readContentFile(relPath: string): Promise<string> {
  // Scoped to the literal "src/content" subfolder in this same join call
  // (not just building the full path from a variable) so Turbopack's
  // tracer only traces that subfolder for the standalone build output,
  // instead of the whole project — see path.join(process.cwd(), relPath)'s
  // build warning this replaced, and the same class of issue this codebase
  // already hit once for the Prisma client output path.
  const sub = relPath.startsWith(`${CONTENT_DIR_NAME}/`) ? relPath.slice(CONTENT_DIR_NAME.length + 1) : relPath;
  return readFile(path.join(process.cwd(), "src/content", sub), "utf8");
}

/** Same as readContentFile, but null instead of throwing when the file doesn't exist — used when switching to a locale that hasn't been created yet. */
export async function readContentFileIfExists(relPath: string): Promise<string | null> {
  try {
    return await readContentFile(relPath);
  } catch {
    return null;
  }
}
