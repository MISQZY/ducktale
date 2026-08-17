"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { useSession } from "next-auth/react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { toast } from "sonner";
import { API } from "@/config/site";
import { renderNotification } from "@/lib/notification-renderers";
import { markNotificationRead } from "@/lib/actions/notifications";
import type { NotificationsResponse } from "@/app/api/notifications/route";

export type NotificationItem = NotificationsResponse["items"][number];

interface NotificationsState {
  items: NotificationItem[];
  unreadCount: number;
  loading: boolean;
}

interface NotificationsContextValue extends NotificationsState {
  /** Optimistic — flips locally immediately, the Server Action call (see NotificationBell.tsx) is fire-and-forget from here since the next poll reconciles either way. */
  markReadLocally: (id: string) => void;
  markAllReadLocally: () => void;
  /** Drops every already-read item from local state — pairs with the "delete read" trash button, which only ever targets read notifications server-side too (see deleteReadNotifications). */
  deleteReadLocally: () => void;
}

const DEFAULT_STATE: NotificationsState = { items: [], unreadCount: 0, loading: true };

const NotificationsContext = createContext<NotificationsContextValue>({
  ...DEFAULT_STATE,
  markReadLocally: () => {},
  markAllReadLocally: () => {},
  deleteReadLocally: () => {},
});

/**
 * Polls /api/notifications (see NotificationsResponse) the same way
 * ServerStatusContext polls server status — a shorter interval
 * (API.notificationsPollIntervalMs) since the whole point of a notification
 * is showing up promptly. Only polls for an authenticated session; an
 * anonymous visitor has no notifications to fetch.
 *
 * The toast-on-new-item logic lives here (not in NotificationBell) so a
 * toast fires regardless of whether the bell dropdown happens to be open —
 * this provider is mounted once, high in the tree, same as
 * ServerStatusProvider.
 */
export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const lang = useLocale();
  const t = useTranslations("Notifications");
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<NotificationsState>(DEFAULT_STATE);
  // Highest createdAtMs already shown as a toast (or present at the first
  // load, which shouldn't itself replay old notifications as toasts) — a
  // ref, not state, since updating it must never itself trigger a re-render.
  const seenThroughMsRef = useRef<number | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const r = await fetch("/api/notifications");
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data: NotificationsResponse = await r.json();

      // Ids this poll decides to silently mark read on the recipient's
      // behalf — see the loop below for why.
      const autoReadIds = new Set<string>();

      if (seenThroughMsRef.current === null) {
        // First load: establish the baseline without toasting anything —
        // otherwise every existing unread notification would replay as a
        // toast on every page load/tab open.
        seenThroughMsRef.current = data.items[0]?.createdAtMs ?? 0;
      } else {
        const newItems = data.items
          .filter((n) => n.createdAtMs > seenThroughMsRef.current!)
          .sort((a, b) => a.createdAtMs - b.createdAtMs);
        for (const n of newItems) {
          const rendered = renderNotification(n.type, n.payload, { lang, t });
          if (!rendered) continue;
          // Already looking at the exact conversation this is about (e.g.
          // TicketThread/ReportThread's own 8s poll is already showing the
          // new message live) — a toast on top of that is just noise, and
          // there's nothing left to alert the user *to* mark read for.
          if (rendered.href === pathname) {
            if (!n.read) autoReadIds.add(n.id);
            continue;
          }
          toast(rendered.message, { action: { label: t("view"), onClick: () => router.push(rendered.href) } });
        }
        if (data.items[0]) {
          seenThroughMsRef.current = Math.max(seenThroughMsRef.current, data.items[0].createdAtMs);
        }
      }

      for (const id of autoReadIds) {
        markNotificationRead(id).catch(() => {});
      }

      // Merge in, don't blindly overwrite, this poll's read flags: clicking a
      // notification marks it read locally (markReadLocally, see
      // handleItemClick in NotificationBell.tsx) and fires the Server Action
      // in the background — if a poll's GET request was already in flight
      // (or served getNotificationsSnapshot's own 15s cache from just before
      // that write's invalidateSnapshot landed), it can report that same
      // item as still unread. `read` never goes true -> false in this app
      // (there's no "mark unread" action), so once local state already has
      // an item read, a poll saying otherwise is stale, not a real change —
      // without this, that stale response replaces state wholesale and the
      // item visibly reverts to unread until the *next* click. autoReadIds
      // (just decided above, this same poll) gets the same treatment as
      // already-locally-read ids, since both are cases where the client
      // knows better than this response about to be applied.
      setState((prev) => {
        const forceReadIds = new Set(prev.items.filter((n) => n.read).map((n) => n.id));
        for (const id of autoReadIds) forceReadIds.add(id);
        let staleUnreadCorrected = 0;
        const items = data.items.map((n) => {
          if (!n.read && forceReadIds.has(n.id)) {
            staleUnreadCorrected++;
            return { ...n, read: true };
          }
          return n;
        });
        return { items, unreadCount: Math.max(0, data.unreadCount - staleUnreadCorrected), loading: false };
      });
    } catch {
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, [lang, t, router, pathname]);

  useEffect(() => {
    if (status !== "authenticated") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting local state to match an external system (the session) going unauthenticated, same shape as ServerStatusContext's own mount-effect fetch
      setState(DEFAULT_STATE);
      seenThroughMsRef.current = null;
      return;
    }

    fetchNotifications();
    const id = setInterval(fetchNotifications, API.notificationsPollIntervalMs);
    return () => clearInterval(id);
  }, [status, fetchNotifications]);

  const markReadLocally = useCallback((id: string) => {
    setState((prev) => {
      const target = prev.items.find((n) => n.id === id);
      if (!target || target.read) return prev;
      return {
        ...prev,
        items: prev.items.map((n) => (n.id === id ? { ...n, read: true } : n)),
        unreadCount: Math.max(0, prev.unreadCount - 1),
      };
    });
  }, []);

  const markAllReadLocally = useCallback(() => {
    setState((prev) => ({
      ...prev,
      items: prev.items.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }));
  }, []);

  const deleteReadLocally = useCallback(() => {
    setState((prev) => ({ ...prev, items: prev.items.filter((n) => !n.read) }));
  }, []);

  return (
    <NotificationsContext.Provider value={{ ...state, markReadLocally, markAllReadLocally, deleteReadLocally }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationsContext);
}
