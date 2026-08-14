"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Users, Castle } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TopPlayersTable } from "./TopPlayersTable";
import { TownRankingTable } from "./TownRankingTable";

type RankingType = "players" | "towns";

/**
 * The two ranking categories — each tab owns its own paginated/searchable
 * table, fetched only once its tab is actually selected (TabsContent
 * unmounts the inactive one).
 *
 * The active tab mirrors to `?type=` in the address bar the same way each
 * table already mirrors its own page/search/sort — via history.replaceState,
 * not a router navigation. `page`/`search`/`sort`/`order` are plain
 * usePagedTable-owned keys (shared by both tables), which is fine since only
 * one table is ever mounted at a time — but switching type must clear them
 * here first, or the newly-mounted table would read the *other* type's
 * leftover page/sort straight out of the URL on mount.
 *
 * Always mounts as "players" — reading `?type=` during the initial useState
 * (like usePagedTable does for page/search/sort) is safe for those because
 * that state only feeds an async fetch, never the first render's DOM. Here
 * `type` directly drives which Radix TabsContent is shown/hidden, so
 * disagreeing with the server's always-"players" render is a real hydration
 * mismatch, not just a cosmetic one — the `?type=towns` case is corrected
 * a tick later in the effect below instead.
 */
export function RankingsTabs() {
  const t = useTranslations("Leaderboard");
  const [type, setType] = useState<RankingType>("players");

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("type");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- restoring persisted state from the URL (an external system) on mount, to avoid a hydration mismatch (see comment above)
    if (fromUrl === "towns") setType("towns");
  }, []);

  const handleValueChange = useCallback((value: string) => {
    const next: RankingType = value === "towns" ? "towns" : "players";
    setType(next);
    if (typeof window === "undefined") return;
    const params = new URLSearchParams();
    if (next !== "players") params.set("type", next);
    const qs = params.toString();
    const url = `${window.location.pathname}${qs ? `?${qs}` : ""}`;
    window.history.replaceState(window.history.state, "", url);
  }, []);

  return (
    <Tabs value={type} onValueChange={handleValueChange} className="items-center gap-5">
      <TabsList>
        <TabsTrigger value="players">
          <Users size={13} />
          {t("tabPlayers")}
        </TabsTrigger>
        <TabsTrigger value="towns">
          <Castle size={13} />
          {t("tabTowns")}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="players" className="w-full">
        <TopPlayersTable />
      </TabsContent>
      <TabsContent value="towns" className="w-full">
        <TownRankingTable />
      </TabsContent>
    </Tabs>
  );
}
