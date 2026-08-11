import { auth } from "@/auth";

export const TICKET_SUBJECT_MAX = 120;
export const TICKET_MESSAGE_MAX = 4000;

// Clamped regardless of the env override — this feeds next.config.mjs's
// serverActions.bodySizeLimit too, which applies to every Server Action in
// the app, not just ticket ones, so a misconfigured env var can't reopen a
// large-body DoS surface app-wide.
export const MAX_ATTACHMENT_MB = Math.min(Math.max(Number(process.env.MAX_TICKET_ATTACHMENT_MB) || 20, 1), 50);
export const MAX_ATTACHMENT_BYTES = MAX_ATTACHMENT_MB * 1024 * 1024;
export const MAX_FILES_PER_MESSAGE = 5;

export interface TicketViewer {
  id: string;
  isAdmin: boolean;
}

/**
 * session.user.isAdmin is populated by the session() callback in auth.ts
 * from a live DB read on every session read (not cached on the JWT itself)
 * — same freshness guarantee requireAdminId() relies on in src/lib/admin.ts,
 * so reading it here doesn't reintroduce the staleness a plain JWT claim
 * would have (e.g. a revoked admin keeping ticket access until token refresh).
 */
export async function getTicketViewer(): Promise<TicketViewer | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  return { id: session.user.id, isAdmin: session.user.isAdmin };
}

export function canViewTicket(viewer: TicketViewer, ticket: { userId: string }): boolean {
  return viewer.isAdmin || viewer.id === ticket.userId;
}
