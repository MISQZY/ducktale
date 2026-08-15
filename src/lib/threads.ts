import { getSiteViewer, type SiteViewer } from "@/lib/site-viewer";

export const THREAD_TITLE_MAX = 120;
export const THREAD_DESCRIPTION_MAX = 300;
export const THREAD_MESSAGE_MAX = 4000;

export type ThreadViewer = SiteViewer;

/**
 * Threads have no ownership-gated visibility like tickets (canViewTicket) —
 * every authenticated user can see and reply to every thread — so this is
 * just "is anyone logged in", re-exported under a threads-specific name for
 * readability at call sites.
 */
export const getThreadViewer = getSiteViewer;
