import { auth } from "@/auth";

export interface SiteViewer {
  id: string;
  isAdmin: boolean;
  roles: string[];
}

/**
 * session.user.isAdmin is populated by the session() callback in auth.ts
 * from a live DB read on every session read (not cached on the JWT itself)
 * — same freshness guarantee requireAdminId() relies on in src/lib/admin.ts,
 * so reading it here doesn't reintroduce the staleness a plain JWT claim
 * would have (e.g. a revoked admin keeping access until token refresh).
 *
 * Shared by tickets (src/lib/tickets.ts re-exports this as
 * getTicketViewer) and threads (src/lib/threads.ts) — both just need
 * {id, isAdmin}, only their per-resource permission rules differ.
 */
export async function getSiteViewer(): Promise<SiteViewer | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  return { id: session.user.id, isAdmin: session.user.isAdmin, roles: session.user.roles };
}
