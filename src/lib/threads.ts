import { getSiteViewer, type SiteViewer } from "@/lib/site-viewer";
import { hasResourceRole } from "@/config/resource-roles";

export const THREAD_TITLE_MAX = 120;
export const THREAD_DESCRIPTION_MAX = 300;
export const THREAD_MESSAGE_MAX = 4000;

export type ThreadViewer = SiteViewer;

/**
 * Threads have no per-thread ownership-gated visibility like tickets
 * (canViewTicket) — every viewer with baseline access (hasThreadAccess,
 * below) can see and reply to every thread — so this is just "is anyone
 * logged in", re-exported under a threads-specific name for readability at
 * call sites. Identity only, not a gate by itself: entry points that need
 * to actually enforce access use requireResourceRole(Id) (pages/Server
 * Actions) or hasThreadAccess (API routes) instead of relying on this
 * returning non-null.
 */
export const getThreadViewer = getSiteViewer;

/**
 * Baseline thread participation (view the list, open/create/reply to a
 * thread) — true for admins and any threads-view holder. Seeded onto the
 * built-in "user" Role (src/config/roles.ts) so every registered account
 * has it by default; an admin can revoke it from a specific Role to
 * actually restrict that Role's holders from threads, which a plain
 * "is logged in" check (the old baseline) couldn't express. Used directly
 * by Server Actions/API routes that can't redirect (see requireResourceRole
 * for the page-level equivalent, used by threads/layout.tsx).
 */
export function hasThreadAccess(viewer: ThreadViewer): boolean {
  return viewer.isAdmin || hasResourceRole(viewer.roles, "threads-view");
}

/** True for admins and any threads-edit holder — moderating someone else's thread (closing/reopening it), distinct from the author's own always-allowed close/reopen. Deleting a thread outright is a separate, stronger capability — see isThreadDeleter. */
export function isThreadModerator(viewer: ThreadViewer): boolean {
  return viewer.isAdmin || hasResourceRole(viewer.roles, "threads-edit");
}

/** threads-edit does not imply threads-delete (or vice versa) — deleting a thread outright is independent from moderating (closing/reopening) one. */
export function isThreadDeleter(viewer: ThreadViewer): boolean {
  return viewer.isAdmin || hasResourceRole(viewer.roles, "threads-delete");
}
