/**
 * Allowed attachment file extensions — the single source of truth, shared
 * between the server-side write path (src/lib/attachments.ts's
 * saveAttachment, which can't be imported into a client component since it
 * pulls in Node's fs/path/crypto) and every client-side file picker (the
 * ticket/report create forms and their reply threads), so a rejected file
 * can be flagged immediately on selection instead of only surfacing as a
 * thrown-error-at-submit that aborts the whole ticket/report.
 *
 * Deliberately excludes anything a browser might execute if it were ever
 * served back inline (html, svg, js, ...) — the download route also forces
 * Content-Disposition: attachment as a second line of defense, but this
 * list is what keeps that kind of content off disk in the first place.
 */
export const ALLOWED_ATTACHMENT_EXTENSIONS = [
  "png", "jpg", "jpeg", "gif", "webp",
  "pdf", "txt", "log", "zip",
  "mp4", "webm", "mov",
  // .jar — reports commonly need to attach the actual mod/plugin file being
  // reported (a cheat client, a malicious plugin), not just a screenshot of it.
  "jar",
] as const;

/** Only the substring after the last dot, stripped to a bare alphanumeric token — matches saveAttachment's own parsing exactly, so a file this accepts client-side is guaranteed to also pass the server's check. */
export function getFileExtension(filename: string): string {
  return (filename.split(".").pop() ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function isAllowedAttachmentExtension(filename: string): boolean {
  return (ALLOWED_ATTACHMENT_EXTENSIONS as readonly string[]).includes(getFileExtension(filename));
}

/**
 * `<input type="file" accept="...">` value — pre-filters the OS file picker
 * (Explorer/Finder) to these extensions so a disallowed file is unlikely to
 * even get selected in the first place. A hint only, not enforcement: every
 * OS picker still offers an "All files" option that bypasses it, which is
 * exactly why isAllowedAttachmentExtension's own check still runs on
 * whatever actually comes back from onChange.
 */
export const ATTACHMENT_ACCEPT = ALLOWED_ATTACHMENT_EXTENSIONS.map((ext) => `.${ext}`).join(",");
