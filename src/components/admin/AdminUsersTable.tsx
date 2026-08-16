"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type { ColumnDef } from "@tanstack/react-table";
import { ShieldAlert } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { useAdminTableSort } from "@/hooks/useAdminTableSort";
import { PlayerAvatar } from "@/components/common/PlayerAvatar";
import { AdminUserActions } from "@/components/admin/AdminUserActions";
import { AdminUserEditDialog } from "@/components/admin/AdminUserEditDialog";
import { UserBadgesCell } from "@/components/admin/UserBadgesCell";
import type { RoleOption } from "@/components/admin/RoleFormDialog";
import { formatLastSeen } from "@/lib/player-card-format";
import { localizedName, type LocalizedName } from "@/lib/i18n-name";

export interface AdminBadgeOption {
  id: string;
  name: LocalizedName;
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
  roleIds: string[];
}

interface AdminUsersTableProps {
  lang: string;
  users: AdminUserRow[];
  badges: AdminBadgeOption[];
  roleOptions: RoleOption[];
  /** From getResourceRole checks on the page (users-edit / users-delete / badges-edit / role-edit / true isAdmin) — a users-view-only holder can reach this table but shouldn't see controls they can't use. users-edit and users-delete are independent (see RESOURCE_ROLE_ACTIONS's doc comment) — a holder of one but not the other sees exactly that one control. */
  canEditUsers: boolean;
  canDeleteUsers: boolean;
  canEditBadges: boolean;
  canManageRoles: boolean;
  sortColumn?: string;
  sortDirection?: "asc" | "desc";
  rowOffset?: number;
}

/** Client island for /admin/users — see AdminBadgesTable's doc comment for why the columns live here. Presence/online booleans are pre-computed server-side (they read an in-memory Map that only exists in the Node process) and passed in as plain data, never recomputed here. */
export function AdminUsersTable({ lang, users, badges, roleOptions, canEditUsers, canDeleteUsers, canEditBadges, canManageRoles, sortColumn, sortDirection, rowOffset }: AdminUsersTableProps) {
  const t = useTranslations("Admin");
  const tc = useTranslations("PlayerCard");
  const onSort = useAdminTableSort(sortColumn, sortDirection);
  // Owned here (not by each row) — see AdminUserEditDialog's doc comment
  // for why a per-row dialog instance lost its open state to revalidation.
  const [editingUser, setEditingUser] = useState<AdminUserRow | null>(null);

  const roleById = useMemo(() => new Map(roleOptions.map((r) => [r.id, r])), [roleOptions]);

  const columns = useMemo<ColumnDef<AdminUserRow, unknown>[]>(() => [
    {
      id: "user",
      header: t("userColumn"),
      size: 240,
      minSize: 160,
      enableHiding: false,
      meta: { headClassName: "align-middle", cellClassName: "align-middle whitespace-normal", withRightBorder: true, sortKey: "user", defaultSortDirection: "asc" },
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
      size: 240,
      minSize: 120,
      // No max-w-0/whitespace-normal here: UserBadgesCell already handles a
      // fixed-width column itself (its own internal overflow-x-auto scroll
      // row) — max-w-0 was the old table-auto-era trick to force a narrow
      // column and actively fights the real width now driven by `size`
      // above (max-width < width clamps the cell to ~0, squeezing/
      // overlapping the badge chips).
      meta: { headClassName: "align-middle", cellClassName: "align-middle", withRightBorder: true },
      cell: ({ row }) => (
        <UserBadgesCell lang={lang} userId={row.original.id} badges={badges} currentBadgeIds={row.original.badgeIds} canEdit={canEditBadges} />
      ),
    },
    {
      id: "roles",
      header: t("rolesColumn"),
      size: 200,
      minSize: 130,
      meta: { headClassName: "align-middle", cellClassName: "align-middle whitespace-normal text-xs text-foreground/60", withRightBorder: true },
      cell: ({ row }) => {
        const names = row.original.roleIds
          .map((id) => roleById.get(id))
          .filter((r): r is RoleOption => !!r)
          .map((r) => localizedName(r.name, lang));
        if (names.length === 0) return <span className="text-foreground/30">—</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {names.map((name, i) => (
              <span key={i} className="rounded-full border border-primary/15 bg-primary/5 px-2 py-0.5 text-[11px] text-foreground/70">
                {name}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      id: "presence",
      header: tc("lastSeenOnSite", { date: "" }).split(":")[0] || "Last seen",
      size: 180,
      minSize: 120,
      meta: { headClassName: "align-middle text-left", cellClassName: "align-middle text-left", withRightBorder: true },
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
      size: 120,
      minSize: 90,
      meta: { headClassName: "align-middle text-center", cellClassName: "align-middle text-center", withRightBorder: true, sortKey: "registration", defaultSortDirection: "asc" },
      cell: ({ row }) => <span className="text-foreground/50 text-xs">{row.original.createdAtLabel}</span>,
    },
    {
      id: "actions",
      header: t("actionsColumn"),
      size: 100,
      minSize: 80,
      enableHiding: false,
      meta: { headClassName: "align-middle text-right", cellClassName: "align-middle text-right" },
      cell: ({ row }) => (
        <AdminUserActions
          lang={lang}
          userId={row.original.id}
          nickname={row.original.nickname}
          isSelf={row.original.isSelf}
          canEdit={canEditUsers || canManageRoles}
          canDelete={canDeleteUsers}
          onEdit={() => setEditingUser(row.original)}
        />
      ),
    },
  ], [lang, badges, canEditBadges, canEditUsers, canDeleteUsers, canManageRoles, roleById, t, tc]);

  return (
    <>
      <DataTable
        columns={columns}
        data={users}
        getRowId={(u) => u.id}
        emptyMessage={t("noResults")}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        onSort={onSort}
        rowOffset={rowOffset}
      />
      <AdminUserEditDialog
        key={editingUser?.id ?? "none"}
        lang={lang}
        open={editingUser !== null}
        onOpenChange={(next) => { if (!next) setEditingUser(null); }}
        user={editingUser}
        canEdit={canEditUsers}
        canManageRoles={canManageRoles}
        roleOptions={roleOptions}
      />
    </>
  );
}
