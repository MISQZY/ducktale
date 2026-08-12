import { NextResponse } from "next/server";
import { isRateLimited } from "@/lib/rate-limit";
import { withCache } from "@/lib/query-cache";
import { getQuestTreeNodes, listQuestCatalogServers } from "@/lib/quest-catalog/getQuestTreeNodes";

const QUEST_CATALOG_TTL_MS = 60_000;

/**
 * Consumption endpoint for the BetonQuest -> quest_catalog ->
 * QuestNodeDef[] pipeline (see BETONQUEST_QUEST_TREE.md). ?server=duckburg
 * scopes to one server; ?package=loreQuests further scopes to one quest
 * line within it (what LiveQuestTree.tsx actually calls this with — see
 * src/content/*\/quests/*.mdx). Both omitted returns every synced node
 * across every server/package together.
 */
export async function GET(req: Request) {
  if (isRateLimited(req, "quest-catalog", 30, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const server = searchParams.get("server")?.trim() || undefined;
  const packageName = searchParams.get("package")?.trim() || undefined;

  try {
    const [nodes, servers] = await withCache(
      `quest-catalog:${server ?? "all"}:${packageName ?? "all"}`,
      QUEST_CATALOG_TTL_MS,
      async () => [await getQuestTreeNodes(server, packageName), await listQuestCatalogServers()] as const
    );

    return NextResponse.json(
      { server: server ?? null, package: packageName ?? null, servers, nodes },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30" } }
    );
  } catch (error) {
    console.error("[quest-catalog] failed to build quest tree nodes:", error);
    return NextResponse.json({ error: "Failed to build quest tree" }, { status: 500 });
  }
}
