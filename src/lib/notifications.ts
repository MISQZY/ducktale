import { siteDb } from "@/lib/site-db";
import { withCache, invalidateByPrefix } from "@/lib/query-cache";
import type { LocalizedName } from "@/lib/i18n-name";

/**
 * Payload shape per notification type — the thing that actually makes this
 * extensible: adding a new kind of notification is adding one entry here
 * (compile-time-checked at every createNotification call site) plus a
 * renderer in src/lib/notification-renderers.tsx, never a schema migration.
 * The DB column itself is just `type: string` + `payload: Json`
 * (Notification model, site schema) — this map is what gives it real types
 * on the write side.
 */
export interface NotificationPayloads {
  /** Staff replied to `userId`'s own ticket. */
  ticket_reply: { ticketId: string; ticketSubject: string };
  /** Staff closed `userId`'s own ticket (setTicketStatus) — not fired for the ticket owner closing their own ticket. */
  ticket_closed: { ticketId: string; ticketSubject: string };
  /** `userId` was awarded a badge (manually or via an auto-grant condition). */
  badge_awarded: { badgeId: string; badgeName: LocalizedName; badgeIcon: string; badgeColor: string | null };
}

export type NotificationType = keyof NotificationPayloads;

export interface NotificationRow<T extends NotificationType = NotificationType> {
  id: string;
  type: T;
  payload: NotificationPayloads[T];
  read: boolean;
  createdAt: Date;
}

export interface NotificationsSnapshot {
  items: NotificationRow[];
  unreadCount: number;
}

const RECENT_LIMIT = 20;
const SNAPSHOT_CACHE_PREFIX = "notifications:";
const SNAPSHOT_CACHE_TTL_MS = 15_000;

function snapshotCacheKey(userId: string): string {
  return SNAPSHOT_CACHE_PREFIX + userId;
}

/** Called after every write below so the *next* poll (even one within the TTL window) reflects it immediately — without this, NotificationsContext's optimistic local update (mark read, mark all read, delete read) could get silently reverted by a still-cached, pre-write snapshot on the next poll. */
function invalidateSnapshot(userId: string): void {
  invalidateByPrefix(snapshotCacheKey(userId));
}

export async function createNotification<T extends NotificationType>(
  userId: string,
  type: T,
  payload: NotificationPayloads[T]
): Promise<void> {
  await siteDb.notification.create({ data: { userId, type, payload } });
  invalidateSnapshot(userId);
}

/**
 * The recent-list + unread-count pair GET /api/notifications actually
 * serves, cached together (not as two separate cache entries — they're
 * never read independently) for a short TTL. NotificationsContext polls
 * that route every API.notificationsPollIntervalMs from every open,
 * authenticated tab — this collapses concurrent tabs/rapid polls from the
 * *same* user into one shared DB round trip, the same shape as
 * getAllOnlinePlayers' own cache for /api/server-status/all. Explicitly
 * invalidated after every write (see invalidateSnapshot) so a poll never
 * serves data older than the reader's own last action.
 */
export async function getNotificationsSnapshot(userId: string): Promise<NotificationsSnapshot> {
  return withCache(snapshotCacheKey(userId), SNAPSHOT_CACHE_TTL_MS, async () => {
    const [items, unreadCount] = await Promise.all([
      siteDb.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: RECENT_LIMIT,
        select: { id: true, type: true, payload: true, read: true, createdAt: true },
      }) as Promise<NotificationRow[]>,
      siteDb.notification.count({ where: { userId, read: false } }),
    ]);
    return { items, unreadCount };
  });
}

/** No-op (not an error) if `id` doesn't belong to `userId` or is already read — the caller (a Server Action) already has the real auth check via the session; this where-clause is just belt-and-suspenders against marking someone else's notification via a forged id. */
export async function markNotificationRead(userId: string, id: string): Promise<void> {
  await siteDb.notification.updateMany({ where: { id, userId }, data: { read: true } });
  invalidateSnapshot(userId);
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await siteDb.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
  invalidateSnapshot(userId);
}

/** Only ever deletes `userId`'s own already-read notifications — an unread one has to be marked read first, same as a real inbox's "clear" action never silently discards something you haven't seen yet. */
export async function deleteReadNotifications(userId: string): Promise<void> {
  await siteDb.notification.deleteMany({ where: { userId, read: true } });
  invalidateSnapshot(userId);
}
