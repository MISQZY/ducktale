"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Users, Plus, Trash2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchInput } from "@/components/ui/search-input";
import { PlayerAvatar } from "@/components/common/PlayerAvatar";
import { useConfirm } from "@/components/common/ConfirmDialogProvider";
import {
  getRoleUsers,
  searchAssignableUsers,
  assignUserToRole,
  removeUserFromRole,
  type RoleUser,
  type AssignableUser,
} from "@/lib/actions/admin-roles";

interface RoleUsersDialogProps {
  lang: string;
  roleId: string;
  roleName: string;
  count: number;
  /** role-edit (or isAdmin) — without it, this shows who holds the role but hides assign/revoke controls. */
  canEdit: boolean;
}

/**
 * Combines "who holds this role" (view) and "grant/revoke it" (edit) in one
 * popover — searching swaps the list from current holders to matching site
 * users, with each row's button (assign/revoke) reflecting whether that user
 * is already a holder. Same shape the old (now-removed) direct resource-role
 * assignment dialog had, just re-pointed at a Role id.
 */
export function RoleUsersDialog({ lang, roleId, roleName, count, canEdit }: RoleUsersDialogProps) {
  const t = useTranslations("Admin.roles");
  const ta = useTranslations("Admin");
  const confirm = useConfirm();
  const [open, setOpen] = useState(false);
  const [holders, setHolders] = useState<RoleUser[] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<AssignableUser[] | null>(null);
  const [isLoading, startLoadTransition] = useTransition();
  const [isMutating, startMutateTransition] = useTransition();
  const [holderCount, setHolderCount] = useState(count);

  function loadHolders() {
    startLoadTransition(async () => {
      const data = await getRoleUsers(roleId);
      setHolders(data);
    });
  }

  function handleOpenChange(isOpen: boolean) {
    setOpen(isOpen);
    if (!isOpen) {
      setSearchQuery("");
      setSearchResults(null);
      return;
    }
    if (holders === null) loadHolders();
  }

  function handleSearchChange(value: string) {
    setSearchQuery(value);
    if (!value.trim()) {
      setSearchResults(null);
      return;
    }
    startLoadTransition(async () => {
      const data = await searchAssignableUsers(value);
      setSearchResults(data);
    });
  }

  const holderIds = new Set((holders ?? []).map((h) => h.userId));

  function handleAssign(userId: string) {
    startMutateTransition(async () => {
      try {
        await assignUserToRole(lang, userId, roleId);
        setHolderCount((n) => n + 1);
        loadHolders();
      } catch (e) {
        console.error(e);
      }
    });
  }

  async function handleRevoke(userId: string, nickname: string) {
    if (!(await confirm({ description: t("confirmRevoke", { role: roleName, nickname }), variant: "destructive" }))) return;
    startMutateTransition(async () => {
      try {
        await removeUserFromRole(lang, userId, roleId);
        setHolderCount((n) => Math.max(0, n - 1));
        setHolders((prev) => (prev ? prev.filter((h) => h.userId !== userId) : null));
      } catch (e) {
        console.error(e);
      }
    });
  }

  const showingSearch = searchQuery.trim().length > 0;
  const rows: { userId: string; nickname: string; skinUrl: string | null; linked: boolean }[] = showingSearch
    ? (searchResults ?? [])
    : (holders ?? []);

  return (
    <Popover open={open} onOpenChange={handleOpenChange} modal={true}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center justify-center gap-1.5 h-7 px-3 rounded-full bg-primary/10 text-primary hover:bg-primary/20 hover:scale-105 text-xs font-semibold tabular-nums transition-all outline-none border border-primary/20 mx-auto"
        >
          <Users size={12} className="opacity-70" />
          {holderCount}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[320px] p-3 rounded-xl liquid-card border-primary/20 flex flex-col gap-3"
        align="center"
      >
        {canEdit && (
          <SearchInput
            placeholder={t("searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="h-8 text-xs"
          />
        )}

        <div className="max-h-[300px] overflow-y-auto custom-scrollbar pr-1 mt-1 space-y-1.5">
          {isLoading && rows.length === 0 ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          ) : rows.length === 0 ? (
            <p className="text-center text-xs text-foreground/50 py-6">
              {showingSearch ? ta("noSearchResults") : t("noHolders")}
            </p>
          ) : (
            rows.map((user) => {
              const isHolder = holderIds.has(user.userId);
              return (
                <div
                  key={user.userId}
                  className="flex items-center justify-between gap-3 p-1.5 rounded-lg border border-primary/10 bg-card/40 hover:bg-primary/5 transition-colors"
                >
                  <PlayerAvatar
                    name={user.nickname}
                    skinUrl={user.skinUrl}
                    hasSiteProfile={true}
                    linked={user.linked}
                    className="flex-1"
                  />
                  {canEdit && (isHolder ? (
                    <button
                      type="button"
                      onClick={() => handleRevoke(user.userId, user.nickname)}
                      disabled={isMutating}
                      className="p-1.5 text-destructive/60 hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors disabled:opacity-50 shrink-0"
                      title={t("revoke")}
                    >
                      <Trash2 size={14} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleAssign(user.userId)}
                      disabled={isMutating}
                      className="p-1.5 text-primary/60 hover:text-primary hover:bg-primary/10 rounded-md transition-colors disabled:opacity-50 shrink-0"
                      title={t("assign")}
                    >
                      <Plus size={14} />
                    </button>
                  ))}
                </div>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
