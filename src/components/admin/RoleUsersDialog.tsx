"use client";

import { useState, useTransition } from "react";
import { Users } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchInput } from "@/components/ui/search-input";
import { getRoleUsers } from "@/lib/actions/admin-roles";
import { PlayerAvatar } from "@/components/common/PlayerAvatar";

interface RoleUsersDialogProps {
  lang: string;
  group: string;
  count: number;
}

interface RoleUser {
  uuid: string;
  name: string | null;
  skinUrl?: string | null;
  hasSiteProfile?: boolean;
}

export function RoleUsersDialog({ lang, group, count }: RoleUsersDialogProps) {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<RoleUser[] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, startTransition] = useTransition();

  function handleOpenChange(isOpen: boolean) {
    setOpen(isOpen);
    if (!isOpen) {
      setSearchQuery("");
    }
    if (isOpen && users === null) {
      startTransition(async () => {
        const data = await getRoleUsers(group);
        setUsers(data);
      });
    }
  }

  const filteredUsers = users?.filter((u) =>
    (u.name || "Аноним").toLowerCase().includes(searchQuery.toLowerCase())
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
      <PopoverContent
        className="w-[320px] p-3 rounded-xl liquid-card border-primary/20 flex flex-col gap-3"
        align="center"
      >
        <SearchInput
          placeholder="Найти"
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
            <p className="text-center text-xs text-foreground/50 py-6">
              Ничего не найдено.
            </p>
          ) : (
            filteredUsers?.map((user) => (
              <div
                key={user.uuid}
                className="flex items-center p-1.5 rounded-lg border border-primary/10 bg-card/40 hover:bg-primary/5 transition-colors"
              >
                <PlayerAvatar
                  name={user.name}
                  skinUrl={user.skinUrl}
                  hasSiteProfile={user.hasSiteProfile}
                  className="flex-1"
                />
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
