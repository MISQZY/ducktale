"use client";

import { useState } from "react";
import { Bell, BellRing, BellOff, CheckCheck, Trash2 } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/context/NotificationsContext";
import { renderNotification } from "@/lib/notification-renderers";
import { formatLastSeen } from "@/lib/player-card-format";
import { usePushSubscription } from "@/hooks/usePushSubscription";
import {
  markNotificationRead,
  markAllNotificationsRead,
  deleteReadNotifications,
} from "@/lib/actions/notifications";

/** Navbar bell — same ghost icon-button convention as ThemeToggle/the duck toggle next to it. Only ever rendered for an authenticated session (see Navbar.tsx), so useNotifications' data is never fetched/shown for an anonymous visitor. */
export function NotificationBell() {
  const t = useTranslations("Notifications");
  const lang = useLocale();
  const { items, unreadCount, markReadLocally, markAllReadLocally, deleteReadLocally } = useNotifications();
  const push = usePushSubscription();
  const [open, setOpen] = useState(false);
  const hasRead = items.some((n) => n.read);

  function handleItemClick(id: string, read: boolean) {
    if (!read) {
      markReadLocally(id);
      // Fire-and-forget — a failure here just means the next poll (or the
      // next time this same item is clicked) reconciles it; not worth a
      // loading/error state for marking one notification read.
      markNotificationRead(id).catch(() => {});
    }
    setOpen(false);
  }

  function handleMarkAllRead() {
    markAllReadLocally();
    markAllNotificationsRead().catch(() => {});
  }

  function handleDeleteRead() {
    deleteReadLocally();
    deleteReadNotifications().catch(() => {});
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          title={t("bellLabel")}
          aria-label={t("bellLabel")}
          className="relative text-primary/70 hover:text-primary hover:bg-primary/10 transition-colors"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center min-w-3.5 h-3.5 px-0.5 rounded-full bg-destructive text-[9px] font-bold leading-none text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border">
          <span className="text-sm font-medium text-foreground/80">{t("title")}</span>
          <div className="flex items-center gap-0.5">
            {/* disabled, not conditionally unmounted — removing the button
                the instant unreadCount/hasRead flips (i.e. mid-click, on the
                very button being clicked) reads to Radix's popover as focus
                escaping its content, which closed it right along with the
                click that was only ever meant to mark things read. */}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0}
              title={t("markAllRead")}
              aria-label={t("markAllRead")}
              className="text-primary/70 hover:text-primary"
            >
              <CheckCheck size={14} />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleDeleteRead}
              disabled={!hasRead}
              title={t("deleteRead")}
              aria-label={t("deleteRead")}
              className="text-foreground/40 hover:text-destructive"
            >
              <Trash2 size={14} />
            </Button>
            {push.support !== "unsupported" && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => push.toggle()}
                disabled={push.support === "checking" || push.busy}
                title={
                  push.error === "denied"
                    ? t("pushPermissionDenied")
                    : push.subscribed
                      ? t("pushDisable")
                      : t("pushEnable")
                }
                aria-label={push.subscribed ? t("pushDisable") : t("pushEnable")}
                className={cn("text-foreground/40 hover:text-primary", push.subscribed && "text-primary/80")}
              >
                {push.subscribed ? <BellRing size={14} /> : <BellOff size={14} />}
              </Button>
            )}
          </div>
        </div>
        {push.error === "generic" && (
          <p className="px-3 py-1.5 text-[11px] text-destructive border-b border-border">{t("pushError")}</p>
        )}

        <div className="max-h-96 overflow-y-auto custom-scrollbar">
          {items.length === 0 ? (
            <p className="text-sm text-foreground/40 text-center py-8">{t("empty")}</p>
          ) : (
            items.map((n) => {
              const rendered = renderNotification(n.type, n.payload, { lang, t });
              // A type with no registered renderer (see notification-renderers.tsx)
              // — skip rather than show a broken row.
              if (!rendered) return null;
              return (
                <Link
                  key={n.id}
                  href={rendered.href}
                  onClick={() => handleItemClick(n.id, n.read)}
                  className={cn(
                    "flex items-start gap-2 px-3 py-2.5 text-sm border-b border-border/50 last:border-0 transition-colors hover:bg-muted",
                    !n.read && "bg-primary/5"
                  )}
                >
                  {!n.read && <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" aria-hidden="true" />}
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-foreground/80", !n.read && "font-medium text-foreground/90")}>
                      {rendered.message}
                    </p>
                    <p className="text-[11px] text-foreground/40 mt-0.5">{formatLastSeen(n.createdAtMs, lang)}</p>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
