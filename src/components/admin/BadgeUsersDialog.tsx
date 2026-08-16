"use client";

import { Trash2, Users } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { getBadgeUsers, revokeBadge } from "@/lib/actions/admin-badges";
import { SearchInput } from "@/components/ui/search-input";
import { PlayerAvatar } from "@/components/common/PlayerAvatar";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useConfirm } from "@/components/common/ConfirmDialogProvider";

interface BadgeUsersDialogProps {
  lang: string;
  badgeId: string;
  badgeName: string;
  count: number;
  /** badges-edit (or isAdmin) — a badges-view-only holder can see who has this badge but not revoke it. */
  canEdit: boolean;
}

interface BadgeUser {
  userId: string;
  name: string | null;
  skinUrl: string | null;
  linked: boolean;
  awardedAt: Date;
}

export function BadgeUsersDialog({ lang, badgeId, badgeName, count, canEdit }: BadgeUsersDialogProps) {
  const t = useTranslations("Admin.badges");
  const ta = useTranslations("Admin");
  const confirm = useConfirm();
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<BadgeUser[] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, startTransition] = useTransition();
  const [isRevoking, startRevokeTransition] = useTransition();

  function handleOpenChange(isOpen: boolean) {
    setOpen(isOpen);
    if (!isOpen) {
      setSearchQuery("");
    }
    if (isOpen && users === null) {
      startTransition(async () => {
        const data = await getBadgeUsers(badgeId);
        setUsers(data);
      });
    }
  }

  async function handleRevoke(userId: string) {
    if (!(await confirm({ description: t("confirmRevokeBadge"), variant: "destructive" }))) return;
    startRevokeTransition(async () => {
      try {
        await revokeBadge(lang, userId, badgeId);
        setUsers((prev) => prev ? prev.filter((u) => u.userId !== userId) : null);
      } catch (e) {
        console.error(e);
      }
    });
  }

  const filteredUsers = users?.filter(u =>
    (u.name || ta("anonymousPlayer")).toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={handleOpenChange} modal={true}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center justify-center gap-1.5 h-7 px-3 rounded-full bg-primary/10 text-primary hover:bg-primary/20 hover:scale-105 text-xs font-semibold tabular-nums transition-all outline-none border border-primary/20 mx-auto"
        >
          <Users size={12} className="opacity-70" />
          {count}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-3 rounded-xl liquid-card border-primary/20 flex flex-col gap-3" align="center">
        <SearchInput
          placeholder={ta("searchPlaceholder")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-8 text-xs"
        />

        <div className="max-h-[300px] overflow-y-auto custom-scrollbar pr-1 mt-1 space-y-1.5">
          {isLoading && !users ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          ) : filteredUsers && filteredUsers.length === 0 ? (
            <p className="text-center text-xs text-foreground/50 py-6">{ta("noSearchResults")}</p>
          ) : (
            filteredUsers?.map((user) => (
              <div
                key={user.userId}
                className="flex items-center justify-between gap-3 p-1.5 rounded-lg border border-primary/10 bg-card/40 hover:bg-primary/5 transition-colors"
              >
                <PlayerAvatar
                  name={user.name}
                  skinUrl={user.skinUrl}
                  hasSiteProfile={true}
                  linked={user.linked}
                  className="flex-1"
                />
                
                <div className="flex items-center gap-2 pl-2">
                  <span className="text-[9px] text-foreground/50 whitespace-nowrap">
                    {new Date(user.awardedAt).toLocaleDateString()}
                  </span>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => handleRevoke(user.userId)}
                      disabled={isRevoking}
                      className="p-1.5 text-destructive/60 hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors disabled:opacity-50 shrink-0"
                      title={t("revokeBadge", { name: badgeName })}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
