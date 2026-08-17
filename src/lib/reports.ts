import { getSiteViewer, type SiteViewer } from "@/lib/site-viewer";
import { hasResourceRole } from "@/config/resource-roles";
import { MAX_ATTACHMENT_MB, MAX_ATTACHMENT_BYTES, MAX_FILES_PER_MESSAGE } from "@/lib/tickets";

export const REPORT_DESCRIPTION_MAX = 2000;
export const REPORT_MESSAGE_MAX = 4000;
// Minecraft nicknames are at most 16 characters (User.nickname's own limit).
export const REPORTED_NAME_MAX = 16;

// Attachment limits aren't ticket-specific in practice (both features share
// the same disk-backed MessageAttachment storage and the same
// next.config.mjs serverActions.bodySizeLimit) — reused directly rather than
// duplicated.
export { MAX_ATTACHMENT_MB, MAX_ATTACHMENT_BYTES, MAX_FILES_PER_MESSAGE };

export type ReportViewer = SiteViewer;

/** Report-specific alias — see getSiteViewer() in @/lib/site-viewer for what this actually does. */
export const getReportViewer = getSiteViewer;

/** reports-edit does not imply reports-view (see hasResourceRole's doc comment, src/config/resource-roles.ts) — an edit-only holder can act on a report they can already see (their own, via ownership below) but can't browse anyone else's without reports-view granted explicitly too. */
export function canViewReport(viewer: ReportViewer, report: { reporterId: string }): boolean {
  return viewer.isAdmin || hasResourceRole(viewer.roles, "reports-view") || viewer.id === report.reporterId;
}

/** True for admins and any reports-view holder — "is this viewer report staff" for display purposes (which side of the thread a message renders on, whether a staff reply is shown anonymized). */
export function isReportStaff(viewer: ReportViewer): boolean {
  return viewer.isAdmin || hasResourceRole(viewer.roles, "reports-view");
}

/** Narrower than isReportStaff — replying as staff and changing status need reports-edit specifically. Deleting a report outright is a separate capability — see isReportDeleter. */
export function isReportEditor(viewer: ReportViewer): boolean {
  return viewer.isAdmin || hasResourceRole(viewer.roles, "reports-edit");
}

/** reports-edit does not imply reports-delete (or vice versa) — deleting a report outright is a stronger, independent capability from editing/deciding one. */
export function isReportDeleter(viewer: ReportViewer): boolean {
  return viewer.isAdmin || hasResourceRole(viewer.roles, "reports-delete");
}
