// Pure, Node-free helpers shared between server code (Server Actions, the
// admin content page) and the client-side workspace UI. Deliberately kept
// separate from admin-content.ts, which imports fs/promises at module scope
// — importing that from a "use client" file would try to bundle Node's fs
// module for the browser and break the build.

import { SERVERS } from "@/config/servers";

export const CONTENT_LOCALES = ["ru", "en"] as const;
export type ContentLocale = (typeof CONTENT_LOCALES)[number];

export interface ContentFileEntry {
  /** Repo-relative path (e.g. "src/content/duckburg/ru/rules/index.mdx") — used for both local fs access and the GitHub commit path. */
  relPath: string;
  server: string;
  lang: string;
  slug: string;
}

// ─── Locale-agnostic tree ───────────────────────────────────────────────
//
// The admin UI shows one file tree per server, not one per locale — ru/en
// are the same page under a different subfolder, so duplicating the whole
// tree per locale would just be visual noise. Locale becomes a toggle next
// to the editor instead; each file node remembers which locales actually
// have a file on disk today so the toggle can hint "not created yet".

export interface ContentTreeFileNode {
  type: "file";
  name: string;
  /** Path relative to the server root, without a locale segment (e.g. "commands/towny.mdx"). */
  slug: string;
  locales: ContentLocale[];
}

export interface ContentTreeFolderNode {
  type: "folder";
  name: string;
  path: string;
  children: ContentTreeNode[];
}

export type ContentTreeNode = ContentTreeFileNode | ContentTreeFolderNode;

export interface ServerContentTree {
  server: string;
  root: ContentTreeNode[];
}

function sortTree(nodes: ContentTreeNode[]): void {
  nodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  for (const node of nodes) if (node.type === "folder") sortTree(node.children);
}

export function buildContentTrees(files: ContentFileEntry[]): ServerContentTree[] {
  const byServer = new Map<string, Map<string, Set<ContentLocale>>>();
  for (const file of files) {
    if (!CONTENT_LOCALES.includes(file.lang as ContentLocale)) continue;
    if (!byServer.has(file.server)) byServer.set(file.server, new Map());
    const slugs = byServer.get(file.server)!;
    if (!slugs.has(file.slug)) slugs.set(file.slug, new Set());
    slugs.get(file.slug)!.add(file.lang as ContentLocale);
  }

  const trees: ServerContentTree[] = [];
  for (const [server, slugs] of byServer) {
    const root: ContentTreeNode[] = [];
    for (const [slug, locales] of slugs) {
      const segments = slug.split("/");
      let children = root;
      for (let i = 0; i < segments.length - 1; i++) {
        const folderPath = segments.slice(0, i + 1).join("/");
        let folder = children.find(
          (n): n is ContentTreeFolderNode => n.type === "folder" && n.path === folderPath
        );
        if (!folder) {
          folder = { type: "folder", name: segments[i], path: folderPath, children: [] };
          children.push(folder);
        }
        children = folder.children;
      }
      children.push({
        type: "file",
        name: segments[segments.length - 1].replace(/\.mdx$/, ""),
        slug,
        locales: [...locales].sort(),
      });
    }
    sortTree(root);
    trees.push({ server, root });
  }
  trees.sort((a, b) => a.server.localeCompare(b.server));
  return trees;
}

export function findTreeFileNode(
  trees: ServerContentTree[],
  server: string,
  slug: string
): ContentTreeFileNode | undefined {
  const tree = trees.find((t) => t.server === server);
  if (!tree) return undefined;

  function search(nodes: ContentTreeNode[]): ContentTreeFileNode | undefined {
    for (const node of nodes) {
      if (node.type === "file" && node.slug === slug) return node;
      if (node.type === "folder") {
        const found = search(node.children);
        if (found) return found;
      }
    }
    return undefined;
  }

  return search(tree.root);
}

/**
 * Direct child names (subfolders and file base-slugs, without extension) at
 * a given folder path — used to populate the "add page" list when editing
 * that folder's meta.json. Root ("") returns the server's top-level entries.
 */
export function listFolderEntryNames(
  trees: ServerContentTree[],
  server: string,
  folderPath: string
): string[] {
  const tree = trees.find((t) => t.server === server);
  if (!tree) return [];

  let nodes = tree.root;
  if (folderPath) {
    for (const segment of folderPath.split("/")) {
      const folder = nodes.find(
        (n): n is ContentTreeFolderNode => n.type === "folder" && n.name === segment
      );
      if (!folder) return [];
      nodes = folder.children;
    }
  }

  return nodes.map((n) => n.name);
}

// ─── Path building + validation for create/save/delete ─────────────────
//
// GitHub's Contents API handles create-vs-update transparently based on
// whether a sha is supplied, so validation here is purely structural: known
// server, known locale, safe-shaped slug — no local-disk lookup needed,
// which is what lets Save also be how new files get created.

const CONTENT_DIR_NAME = "src/content";
const KNOWN_SERVERS = new Set(SERVERS.map((s) => s.id));
const SAFE_MDX_SLUG_PATTERN = /^[a-z0-9][a-z0-9/_-]*\.mdx$/i;
// fumadocs-mdx's per-folder ordering/visibility file — either at a server's
// root ("meta.json") or inside a subfolder ("rules/meta.json").
const META_FILENAME = "meta.json";
const SAFE_META_SLUG_PATTERN = /^([a-z0-9][a-z0-9/_-]*\/)?meta\.json$/i;

export function isKnownServer(server: string): boolean {
  return KNOWN_SERVERS.has(server);
}

export function isValidLocale(locale: string): locale is ContentLocale {
  return (CONTENT_LOCALES as readonly string[]).includes(locale);
}

export function isMetaSlug(slug: string): boolean {
  return slug === META_FILENAME || slug.endsWith(`/${META_FILENAME}`);
}

export function metaSlugFor(folderPath: string): string {
  return folderPath ? `${folderPath}/${META_FILENAME}` : META_FILENAME;
}

export function isSafeSlug(slug: string): boolean {
  if (slug.includes("..") || slug.includes("//")) return false;
  return SAFE_MDX_SLUG_PATTERN.test(slug) || SAFE_META_SLUG_PATTERN.test(slug);
}

export function buildRelPath(server: string, locale: string, slug: string): string {
  return `${CONTENT_DIR_NAME}/${server}/${locale}/${slug}`;
}
