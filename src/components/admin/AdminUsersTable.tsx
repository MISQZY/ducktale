"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import type { ColumnDef } from "@tanstack/react-table";
import { ShieldAlert } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { PlayerAvatar } from "@/components/common/PlayerAvatar";
import { AdminUserActions } from "@/components/admin/AdminUserActions";
import { UserBadgesCell } from "@/components/admin/UserBadgesCell";
import { formatLastSeen } from "@/lib/player-card-format";

export interface AdminBadgeOption {
  id: string;
  name: string;
  icon: string;
  color: string | null;
}

export interface AdminUserRow {
  id: string;
  nickname: string;
  isAdmin: boolean;
  isSelf: boolean;
  createdAtLabel: string;
  skinUrl: string | null;
  isLinked: boolean;
  isPending: boolean;
  linkedName: string | null;
  siteOnline: boolean;
  siteLastSeenMs: number | null;
  mcOnline: boolean;
  serverLastSeenMs: number | null;
  badgeIds: string[];
}

interface AdminUsersTableProps {
  lang: string;
  users: AdminUserRow[];
  badges: AdminBadgeOption[];
}

/** Client island for /admin/users — see AdminBadgesTable's doc comment for why the columns live here. Presence/online booleans are pre-computed server-side (they read an in-memory Map that only exists in the Node process) and passed in as plain data, never recomputed here. */
export function AdminUsersTable({ lang, users, badges }: AdminUsersTableProps) {
  const t = useTranslations("Admin");
  const tc = useTranslations("PlayerCard");

  const columns = useMemo<ColumnDef<AdminUserRow, unknown>[]>(() => [
    {
      id: "user",
      header: t("userColumn"),
      meta: { headClassName: "w-[240px] align-middle", cellClassName: "align-middle", withRightBorder: true },
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex flex-col gap-1.5">
            <PlayerAvatar
              name={user.nickname}
              skinUrl={user.skinUrl}
              hasSiteProfile={true}
              linked={user.isLinked}
              siteOnline={user.siteOnline}
              online={user.mcOnline}
              appendNode={
                user.isAdmin ? (
                  <span title={t("adminBadge")} className="flex shrink-0">
                    <ShieldAlert size={14} className="text-primary/70" />
                  </span>
                ) : null
              }
            />
            <span className="text-foreground/45 text-xs">
              {user.isLinked
                ? t("linkedAs", { name: user.linkedName ?? "" })
                : user.isPending
                  ? t("pending")
                  : t("notLinked")}
            </span>
          </div>
        );
      },
    },
    {
      id: "badges",
      header: t("badgesLabel"),
      meta: { headClassName: "align-middle", cellClassName: "align-middle max-w-0", withRightBorder: true },
      cell: ({ row }) => (
        <UserBadgesCell lang={lang} userId={row.original.id} badges={badges} currentBadgeIds={row.original.badgeIds} />
      ),
    },
    {
      id: "presence",
      header: tc("lastSeenOnSite", { date: "" }).split(":")[0] || "Last seen",
      meta: { headClassName: "w-[180px] align-middle text-left", cellClassName: "align-middle text-left", withRightBorder: true },
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex flex-col gap-1.5 justify-center">
            <div className="flex items-center justify-start text-xs">
              {user.siteOnline ? (
                <span className="inline-flex items-center gap-1.5 font-medium text-blue-600 dark:text-blue-400">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
                  </span>
                  {tc("siteOnline")}
                </span>
              ) : user.siteLastSeenMs ? (
                <span className="text-foreground/50">Сайт: {formatLastSeen(user.siteLastSeenMs, lang)}</span>
              ) : (
                <span className="text-foreground/30 italic">Сайт: —</span>
              )}
            </div>
            {user.isLinked && (
              <div className="flex items-center justify-start text-xs">
                {user.mcOnline ? (
                  <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                    </span>
                    {tc("online")}
                  </span>
                ) : user.serverLastSeenMs ? (
                  <span className="text-foreground/50">Сервер: {formatLastSeen(user.serverLastSeenMs, lang)}</span>
                ) : (
                  <span className="text-foreground/30 italic">Сервер: —</span>
                )}
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: "registration",
      header: t("registrationColumn"),
      meta: { headClassName: "w-[120px] align-middle text-center", cellClassName: "align-middle text-center", withRightBorder: true },
      cell: ({ row }) => <span className="text-foreground/50 text-xs">{row.original.createdAtLabel}</span>,
    },
    {
      id: "actions",
      header: t("actionsColumn"),
      meta: { headClassName: "w-[180px] align-middle text-right", cellClassName: "align-middle text-right" },
      cell: ({ row }) => (
        <AdminUserActions
          lang={lang}
          userId={row.original.id}
          nickname={row.original.nickname}
          isSelf={row.original.isSelf}
          hasLink={row.original.isLinked}
          isAdmin={row.original.isAdmin}
        />
      ),
    },
  ], [lang, badges, t, tc]);

  return <DataTable columns={columns} data={users} getRowId={(u) => u.id} emptyMessage={t("noResults")} />;
}
