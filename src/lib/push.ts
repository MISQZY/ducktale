import webpush from "web-push";
import { siteDb } from "@/lib/site-db";
import { localizedName } from "@/lib/i18n-name";
import type { NotificationPayloads, NotificationType } from "@/lib/notifications";

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT;

const configured = !!(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY && VAPID_SUBJECT);
if (configured) {
  webpush.setVapidDetails(VAPID_SUBJECT!, VAPID_PUBLIC_KEY!, VAPID_PRIVATE_KEY!);
} else {
  // No-op mode, not a hard failure — lets the rest of the notification flow
  // (in-site bell/toast) keep working in an environment that hasn't
  // generated VAPID keys yet (e.g. a fresh local checkout).
  console.warn("[push] VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY/VAPID_SUBJECT not fully set — Web Push is disabled.");
}

interface PushText {
  title: string;
  body: string;
  url: string;
}

type PushRenderer<T extends NotificationType> = (payload: NotificationPayloads[T]) => PushText;

/**
 * Server-side twin of src/lib/notification-renderers.tsx's RENDERERS map —
 * one entry per NotificationType, same extensibility contract (a new
 * notification type needs an entry here too, or its push falls back to a
 * generic "you have a new notification" pointing at the homepage) and the
 * same per-type `href`/`url` this app already resolves client-side. Kept as
 * a separate map (not reused from notification-renderers.tsx) since that
 * file needs a live `t`/`useTranslations` from next-intl, unusable outside a
 * request's React tree. Deliberately fixed Russian text, not next-intl:
 * there's no persisted per-user locale preference anywhere in this app (only
 * the current page's [lang] segment, which a push has no way to know), so
 * this can't pick the right language per recipient. Matches the site's own
 * ru-default convention (see ARCHITECTURE.md) rather than guessing —
 * upgradeable later if a stored locale preference is ever added.
 */
const PUSH_RENDERERS: { [T in NotificationType]: PushRenderer<T> } = {
  ticket_reply: (payload) => ({ title: "Новый ответ в тикете", body: `«${payload.ticketSubject}»`, url: `/ru/account/tickets/${payload.ticketId}` }),
  ticket_closed: (payload) => ({ title: "Тикет закрыт", body: `«${payload.ticketSubject}»`, url: `/ru/account/tickets/${payload.ticketId}` }),
  badge_awarded: (payload) => ({ title: "Новый бейдж", body: `Вы получили «${localizedName(payload.badgeName, "ru")}»`, url: "/ru/profile" }),
  report_reply: (payload) => ({ title: "Новый ответ по репорту", body: `На «${payload.reportedName}»`, url: `/ru/account/reports/${payload.reportId}` }),
  report_status_changed: (payload) => ({ title: "Статус репорта изменён", body: `На «${payload.reportedName}»`, url: `/ru/account/reports/${payload.reportId}` }),
  application_reply: (payload) => ({ title: "Новый ответ по заявке", body: `«${payload.applicantName}»`, url: `/ru/account/applications/${payload.applicationId}` }),
  application_status_changed: (payload) => ({ title: "Статус заявки изменён", body: `«${payload.applicantName}»`, url: `/ru/account/applications/${payload.applicationId}` }),
};

// routing.ts's localePrefix is "always" (every URL needs a /ru or /en
// segment) — hardcoded to /ru here for the same reason the text itself is
// Russian-only (see PUSH_RENDERERS' doc comment): without a stored per-user
// locale, an unprefixed path would just cost an extra redirect through the
// i18n middleware to reach the same /ru URL anyway.
function renderPushText<T extends NotificationType>(type: T, payload: NotificationPayloads[T]): PushText {
  const renderer = PUSH_RENDERERS[type] as PushRenderer<T> | undefined;
  return renderer ? renderer(payload) : { title: "DuckTale", body: "У вас новое уведомление", url: "/ru" };
}

/**
 * Sends a Web Push notification to every subscription `userId` holds
 * (multiple devices/browsers get one push each). Called from
 * createNotification() (src/lib/notifications.ts) right after the in-site
 * Notification row is written — a single choke point, so every existing and
 * future notification type is pushed automatically without touching any of
 * their call sites (sendTicketMessage, awardBadge, setReportStatus, ...).
 */
export async function sendPushToUser<T extends NotificationType>(
  userId: string,
  type: T,
  payload: NotificationPayloads[T]
): Promise<void> {
  if (!configured) return;

  const subscriptions = await siteDb.pushSubscription.findMany({ where: { userId } });
  if (subscriptions.length === 0) return;

  const { title, body, url } = renderPushText(type, payload);
  const message = JSON.stringify({ title, body, url });

  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        message
      )
    )
  );

  // Prune subscriptions the push service reports as permanently gone
  // (404/410) — the same lazily-clean-what-turned-stale pattern already used
  // elsewhere in this app (skin cache, presence). Any other failure (e.g. a
  // transient network error) is left alone; it isn't proof the subscription
  // itself is dead.
  const deadIds: string[] = [];
  results.forEach((result, i) => {
    if (result.status === "rejected") {
      const statusCode = (result.reason as { statusCode?: number })?.statusCode;
      if (statusCode === 404 || statusCode === 410) deadIds.push(subscriptions[i].id);
    }
  });
  if (deadIds.length > 0) {
    await siteDb.pushSubscription.deleteMany({ where: { id: { in: deadIds } } });
  }
}
