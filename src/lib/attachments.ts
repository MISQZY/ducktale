import { join } from "path";
import { mkdir } from "fs/promises";
import { createWriteStream, existsSync } from "fs";
import { pipeline } from "stream/promises";
import { Readable } from "stream";
import { randomUUID } from "crypto";

const UPLOADS_DIR = join(process.cwd(), "uploads", "attachments");

// Deliberately excludes anything a browser might execute if it were ever
// served back inline (html, svg, js, ...) — the download route also forces
// Content-Disposition: attachment as the primary defense, but this list is
// what keeps that kind of content off disk in the first place.
const ALLOWED_EXTENSIONS = new Set([
  "png", "jpg", "jpeg", "gif", "webp",
  "pdf", "txt", "log", "zip",
  "mp4", "webm", "mov",
]);

export async function saveAttachment(file: File): Promise<{ filename: string; size: number; mimeType: string; path: string }> {
  // Only the substring after the last dot, stripped to a bare alphanumeric
  // token — this can never come out containing "/" or ".." regardless of
  // what's in the original (client-supplied) filename, so it's safe to
  // build a filesystem path from directly.
  const rawExt = (file.name.split(".").pop() ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!rawExt || !ALLOWED_EXTENSIONS.has(rawExt)) {
    throw new Error(`File type not allowed: ${file.name}`);
  }

  if (!existsSync(UPLOADS_DIR)) {
    await mkdir(UPLOADS_DIR, { recursive: true });
  }

  const uniqueName = `${randomUUID()}.${rawExt}`;
  const filePath = join(UPLOADS_DIR, uniqueName);

  const writeStream = createWriteStream(filePath);
  await pipeline(Readable.fromWeb(file.stream() as unknown as import("stream/web").ReadableStream), writeStream);

  return {
    filename: file.name.slice(0, 255),
    size: file.size,
    // Never trusted for how the file is served back (see the download
    // route) — client-supplied and trivially spoofable, kept only for display.
    mimeType: file.type || "application/octet-stream",
    path: uniqueName,
  };
}
