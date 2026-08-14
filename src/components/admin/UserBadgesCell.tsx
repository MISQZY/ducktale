"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { awardBadge, revokeBadge } from "@/lib/actions/admin-badges";
import { BadgeChip } from "@/components/badges/BadgeChip";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { useConfirm } from "@/components/common/ConfirmDialogProvider";

interface BadgeOption {
  id: string;
  name: string;
  icon: string;
  color: string | null;
}

interface UserBadgesCellProps {
  lang: string;
  userId: string;
  badges: BadgeOption[];
  currentBadgeIds: string[];
}

export function UserBadgesCell({ lang, userId, badges, currentBadgeIds }: UserBadgesCellProps) {
  const t = useTranslations("Admin");
  const confirm = useConfirm();
  const [isPending, startTransition] = useTransition();
  const [heldIds, setHeldIds] = useState<string[]>(currentBadgeIds ?? []);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleAwardBadge(badgeId: string) {
    setError(null);
    startTransition(async () => {
      try {
        await awardBadge(lang, userId, badgeId);
        setHeldIds((prev) => (prev.includes(badgeId) ? prev : [...prev, badgeId]));
        setPickerOpen(false);
      } catch {
        setError(t("actionFailed"));
      }
    });
  }

  async function handleRevokeBadge(badgeId: string) {
    if (!(await confirm({ description: t("confirmRevokeBadge"), variant: "destructive" }))) return;
    setError(null);
    startTransition(async () => {
      try {
        await revokeBadge(lang, userId, badgeId);
        setHeldIds((prev) => prev.filter((id) => id !== badgeId));
      } catch {
        setError(t("actionFailed"));
      }
    });
  }

  const heldBadges = badges.filter((b) => heldIds.includes(b.id));
  const availableBadges = badges.filter((b) => !heldIds.includes(b.id));

  // Search & Pagination for the modal
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const filteredBadges = availableBadges.filter((b) =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filteredBadges.length / PAGE_SIZE));
  const paginatedBadges = filteredBadges.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="relative min-w-0 flex items-center gap-2 py-1 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] mask-edges">
          {heldBadges.map((b) => (
            <div key={b.id} className="shrink-0">
              <BadgeChip
                name={b.name}
                icon={b.icon}
                color={b.color}
                onRemove={() => handleRevokeBadge(b.id)}
                disabled={isPending}
              />
            </div>
          ))}

          {availableBadges.length > 0 && (
            <Popover open={pickerOpen} onOpenChange={(open) => {
              setPickerOpen(open);
              if (!open) {
                setSearchQuery("");
                setPage(1);
              }
            }} modal={true}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  disabled={isPending}
                  aria-label={t("awardBadge")}
                  title={t("awardBadge")}
                  className="flex items-center justify-center shrink-0 w-6 h-6 rounded-full border border-dashed border-primary/30 text-primary/50 hover:bg-primary/10 hover:text-primary transition-colors disabled:opacity-50"
                >
                  <Plus size={12} />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-3 rounded-xl liquid-card border-primary/20 flex flex-col gap-3" align="start">
                <SearchInput
                  placeholder={t("badgeSearchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="h-8 text-xs"
                />

                <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[220px]">
                  {paginatedBadges.length === 0 ? (
                    <p className="text-center text-xs text-foreground/40 py-6">{t("noSearchResults")}</p>
                  ) : (
                    paginatedBadges.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => handleAwardBadge(b.id)}
                        disabled={isPending}
                        className="flex items-center justify-between gap-3 rounded-lg border border-primary/10 bg-card/40 hover:bg-primary/10 hover:border-primary/30 p-2 transition-all text-left"
                      >
                        <BadgeChip name={b.name} icon={b.icon} color={b.color} />
                      </button>
                    ))
                  )}
                </div>

                {totalPages > 1 && (
                  <div className="pt-2 border-t border-primary/10 mt-1">
                    <Pagination>
                      <PaginationContent className="w-full justify-between gap-0">
                        <PaginationItem>
                          <PaginationPrevious
                            href="#"
                            onClick={(e) => { e.preventDefault(); setPage((p) => Math.max(1, p - 1)); }}
                            className={cn("h-7 px-2 py-1 text-[10px]", page <= 1 && "pointer-events-none opacity-50")}
                            text={t("prevPage")}
                          />
                        </PaginationItem>
                        <PaginationItem>
                          <span className="text-[10px] text-foreground/50 tabular-nums">
                            {page} / {totalPages}
                          </span>
                        </PaginationItem>
                        <PaginationItem>
                          <PaginationNext
                            href="#"
                            onClick={(e) => { e.preventDefault(); setPage((p) => Math.min(totalPages, p + 1)); }}
                            className={cn("h-7 px-2 py-1 text-[10px]", page >= totalPages && "pointer-events-none opacity-50")}
                            text={t("nextPage")}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          )}

          {heldBadges.length === 0 && availableBadges.length === 0 && (
            <span className="text-foreground/30 text-xs italic shrink-0">{t("noBadgesHeld")}</span>
          )}
      {error && <p className="absolute -bottom-4 left-4 w-full text-xs text-destructive">{error}</p>}
    </div>
  );
}
