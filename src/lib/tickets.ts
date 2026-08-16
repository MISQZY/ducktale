import { getSiteViewer, type SiteViewer } from "@/lib/site-viewer";
import { hasResourceRole } from "@/config/resource-roles";

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

/** tickets-edit does not imply tickets-view (see hasResourceRole's doc comment, src/config/resource-roles.ts) — an edit-only holder can act on a ticket they can already see (their own, via ownership below) but can't browse anyone else's without tickets-view granted explicitly too. */
export function canViewTicket(viewer: TicketViewer, ticket: { userId: string }): boolean {
  return viewer.isAdmin || hasResourceRole(viewer.roles, "tickets-view") || viewer.id === ticket.userId;
}

/**
 * True for admins and any tickets-view holder — "is this viewer ticket
 * staff" for display purposes (which side of the thread a message renders
 * on, whether a staff reply is shown anonymized, the initiator header).
 * tickets-edit alone does **not** make someone staff here — tickets-edit no
 * longer implies tickets-view (see hasResourceRole's doc comment), so a
 * role meant to both browse and act on tickets needs both grants explicitly.
 */
export function isTicketStaff(viewer: TicketViewer): boolean {
  return viewer.isAdmin || hasResourceRole(viewer.roles, "tickets-view");
}

/** Narrower than isTicketStaff — staff actions (replying as staff, closing/reopening) need tickets-edit specifically. Deleting a ticket outright is a separate capability — see isTicketDeleter. */
export function isTicketEditor(viewer: TicketViewer): boolean {
  return viewer.isAdmin || hasResourceRole(viewer.roles, "tickets-edit");
}

/** tickets-edit does not imply tickets-delete (or vice versa) — deleting a ticket outright is a stronger, independent capability from editing/closing one. */
export function isTicketDeleter(viewer: TicketViewer): boolean {
  return viewer.isAdmin || hasResourceRole(viewer.roles, "tickets-delete");
}
