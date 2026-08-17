import type { useTranslations } from "next-intl";
import type { NotificationPayloads, NotificationType } from "@/lib/notifications";
import { localizedName } from "@/lib/i18n-name";

export interface RenderedNotification {
  message: string;
  href: string;
}

type T = ReturnType<typeof useTranslations<"Notifications">>;

type Renderer<Type extends NotificationType> = (
  payload: NotificationPayloads[Type],
  ctx: { lang: string; t: T }
) => RenderedNotification;

/**
 * One entry per NotificationType (src/lib/notifications.ts) — the other
 * half of what makes the notification system extensible: a new type is a
 * new payload shape there, plus a new renderer here, never a change to the
 * bell/toast components themselves (NotificationBell.tsx,
 * NotificationsContext.tsx), which only ever call renderNotification.
 */
const RENDERERS: { [Type in NotificationType]: Renderer<Type> } = {
  ticket_reply: (payload, { t }) => ({
    message: t("ticketReply", { subject: payload.ticketSubject }),
    href: `/tickets/${payload.ticketId}`,
  }),
  ticket_closed: (payload, { t }) => ({
    message: t("ticketClosed", { subject: payload.ticketSubject }),
    href: `/tickets/${payload.ticketId}`,
  }),
  badge_awarded: (payload, { t, lang }) => ({
    message: t("badgeAwarded", { name: localizedName(payload.badgeName, lang) }),
    href: `/profile`,
  }),
  report_reply: (payload, { t }) => ({
    message: t("reportReply", { reportedName: payload.reportedName }),
    href: `/reports/${payload.reportId}`,
  }),
  report_status_changed: (payload, { t }) => ({
    message: t("reportStatusChanged", { reportedName: payload.reportedName }),
    href: `/reports/${payload.reportId}`,
  }),
  application_reply: (payload, { t }) => ({
    message: t("applicationReply", { applicantName: payload.applicantName }),
    href: `/applications/${payload.applicationId}`,
  }),
  application_status_changed: (payload, { t }) => ({
    message: t("applicationStatusChanged", { applicantName: payload.applicantName }),
    href: `/applications/${payload.applicationId}`,
  }),
};

/** null for a type with no registered renderer — e.g. an older client that hasn't shipped a newly-added type's renderer yet, or plain data corruption. Callers skip rendering that notification rather than crashing on it. */
export function renderNotification(
  type: string,
  payload: unknown,
  ctx: { lang: string; t: T }
): RenderedNotification | null {
  const renderer = RENDERERS[type as NotificationType] as Renderer<NotificationType> | undefined;
  if (!renderer) return null;
  return renderer(payload as NotificationPayloads[NotificationType], ctx);
}
