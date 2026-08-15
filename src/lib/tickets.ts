import { getSiteViewer, type SiteViewer } from "@/lib/site-viewer";

export const TICKET_SUBJECT_MAX = 120;
export const TICKET_MESSAGE_MAX = 4000;

// Clamped regardless of the env override — this feeds next.config.mjs's
// serverActions.bodySizeLimit too, which applies to every Server Action in
// the app, not just ticket ones, so a misconfigured env var can't reopen a
// large-body DoS surface app-wide.
export const MAX_ATTACHMENT_MB = Math.min(Math.max(Number(process.env.MAX_TICKET_ATTACHMENT_MB) || 20, 1), 50);
export const MAX_ATTACHMENT_BYTES = MAX_ATTACHMENT_MB * 1024 * 1024;
export const MAX_FILES_PER_MESSAGE = 5;

export type TicketViewer = SiteViewer;

/** Ticket-specific alias — see getSiteViewer() in @/lib/site-viewer for what this actually does. */
export const getTicketViewer = getSiteViewer;

export function canViewTicket(viewer: TicketViewer, ticket: { userId: string }): boolean {
  return viewer.isAdmin || viewer.id === ticket.userId;
}
