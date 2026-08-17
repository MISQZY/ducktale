import { getSiteViewer, type SiteViewer } from "@/lib/site-viewer";
import { hasResourceRole } from "@/config/resource-roles";
import { MAX_ATTACHMENT_MB, MAX_ATTACHMENT_BYTES, MAX_FILES_PER_MESSAGE } from "@/lib/tickets";

export const APPLICATION_DESCRIPTION_MAX = 2000;
export const APPLICATION_MESSAGE_MAX = 4000;
// Minecraft nicknames are at most 16 characters (User.nickname's own limit).
export const APPLICANT_NAME_MAX = 16;

// Attachment limits aren't ticket-specific in practice (both features share
// the same disk-backed MessageAttachment storage and the same
// next.config.mjs serverActions.bodySizeLimit) — reused directly rather than
// duplicated.
export { MAX_ATTACHMENT_MB, MAX_ATTACHMENT_BYTES, MAX_FILES_PER_MESSAGE };

export type ApplicationViewer = SiteViewer;

/** Application-specific alias — see getSiteViewer() in @/lib/site-viewer for what this actually does. */
export const getApplicationViewer = getSiteViewer;

/** applications-edit does not imply applications-view (see hasResourceRole's doc comment, src/config/resource-roles.ts) — an edit-only holder can act on an application they can already see (their own, via ownership below) but can't browse anyone else's without applications-view granted explicitly too. */
export function canViewApplication(viewer: ApplicationViewer, application: { applicantId: string }): boolean {
  return viewer.isAdmin || hasResourceRole(viewer.roles, "applications-view") || viewer.id === application.applicantId;
}

/** True for admins and any applications-view holder — "is this viewer application staff" for display purposes (which side of the thread a message renders on, whether a staff reply is shown anonymized). */
export function isApplicationStaff(viewer: ApplicationViewer): boolean {
  return viewer.isAdmin || hasResourceRole(viewer.roles, "applications-view");
}

/** Narrower than isApplicationStaff — replying as staff and changing status need applications-edit specifically. Deleting an application outright is a separate capability — see isApplicationDeleter. */
export function isApplicationEditor(viewer: ApplicationViewer): boolean {
  return viewer.isAdmin || hasResourceRole(viewer.roles, "applications-edit");
}

/** applications-edit does not imply applications-delete (or vice versa) — deleting an application outright is a stronger, independent capability from editing/deciding one. */
export function isApplicationDeleter(viewer: ApplicationViewer): boolean {
  return viewer.isAdmin || hasResourceRole(viewer.roles, "applications-delete");
}
