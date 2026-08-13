"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { X, Plus } from "lucide-react";
import { awardBadge, revokeBadge } from "@/lib/actions/admin-badges";
import { BadgeChip } from "@/components/badges/BadgeChip";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

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

  function handleRevokeBadge(badgeId: string) {
    if (!window.confirm(t("confirmRevokeBadge"))) return;
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
    <div className="flex flex-wrap items-center gap-1.5">
      {heldBadges.map((b) => (
        <BadgeChip
          key={b.id}
          name={b.name}
          icon={b.icon}
          color={b.color}
          size="sm"
          onRemove={() => handleRevokeBadge(b.id)}
          disabled={isPending}
        />
      ))}

      {availableBadges.length > 0 && (
        <Dialog open={pickerOpen} onOpenChange={(open) => {
          setPickerOpen(open);
          if (!open) {
            setSearchQuery("");
            setPage(1);
          }
        }}>
          <DialogTrigger asChild>
            <button
              type="button"
              disabled={isPending}
              aria-label={t("awardBadge")}
              title={t("awardBadge")}
              className="flex items-center justify-center w-6 h-6 rounded-full border border-dashed border-primary/30 text-primary/50 hover:bg-primary/10 hover:text-primary transition-colors disabled:opacity-50"
            >
              <Plus size={12} />
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm max-h-[85vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-center">{t("awardBadge")}</DialogTitle>
            </DialogHeader>

            <div className="px-1 pt-2 pb-1">
              <input
                type="text"
                placeholder={t("badgeSearchPlaceholder")}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-primary/20 bg-card/50 px-3 py-1.5 text-xs text-foreground/90 focus:outline-none focus:border-primary/50"
              />
            </div>

            <div className="flex flex-col gap-2 overflow-y-auto mt-2 min-h-[250px]">
              {paginatedBadges.length === 0 ? (
                <p className="text-center text-xs text-foreground/40 py-8">{t("noSearchResults")}</p>
              ) : (
                paginatedBadges.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => handleAwardBadge(b.id)}
                    disabled={isPending}
                    className="flex items-center justify-between gap-3 rounded-lg border border-primary/10 bg-card/40 hover:bg-primary/10 hover:border-primary/30 p-2.5 transition-all text-left"
                  >
                    <BadgeChip name={b.name} icon={b.icon} color={b.color} size="sm" />
                    <span className="text-xs text-foreground/50">{t("awardBadge")}</span>
                  </button>
                ))
              )}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-3 border-t border-primary/10 mt-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1 text-xs rounded-md hover:bg-primary/10 disabled:opacity-30 disabled:pointer-events-none"
                >
                  {t("prevPage")}
                </button>
                <span className="text-xs text-foreground/50 tabular-nums">{page} / {totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-1 text-xs rounded-md hover:bg-primary/10 disabled:opacity-30 disabled:pointer-events-none"
                >
                  {t("nextPage")}
                </button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      {heldBadges.length === 0 && availableBadges.length === 0 && (
        <span className="text-foreground/30 text-xs italic">{t("noBadgesHeld")}</span>
      )}

      {error && <p className="w-full text-xs text-destructive">{error}</p>}
    </div>
  );
}
