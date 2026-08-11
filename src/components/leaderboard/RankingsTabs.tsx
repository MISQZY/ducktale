"use client";

import { useTranslations } from "next-intl";
import { Users, Castle } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TopPlayersTable } from "./TopPlayersTable";
import { TownRankingTable } from "./TownRankingTable";

/** The two ranking categories — each tab owns its own paginated/searchable table, fetched only once its tab is actually selected (TabsContent unmounts the inactive one). */
export function RankingsTabs() {
  const t = useTranslations("Leaderboard");

  return (
    <Tabs defaultValue="players" className="items-center">
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
