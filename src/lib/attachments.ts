import { join } from "path";
import { mkdir, unlink } from "fs/promises";
import { createWriteStream, existsSync } from "fs";
import { pipeline } from "stream/promises";
import { Readable } from "stream";
import { randomUUID } from "crypto";
import { getFileExtension, isAllowedAttachmentExtension } from "@/config/attachments";

const UPLOADS_DIR = join(process.cwd(), "uploads", "attachments");

export async function saveAttachment(file: File): Promise<{ filename: string; size: number; mimeType: string; path: string }> {
  // getFileExtension never returns anything containing "/" or ".." regardless
  // of what's in the original (client-supplied) filename, so it's safe to
  // build a filesystem path from directly.
  const rawExt = getFileExtension(file.name);
  if (!isAllowedAttachmentExtension(file.name)) {
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

/** Best-effort — callers deleting a DB row shouldn't fail the whole operation over a file that's already gone from disk. */
export async function deleteAttachmentFile(path: string): Promise<void> {
  const filePath = join(UPLOADS_DIR, path);
  if (existsSync(filePath)) {
    await unlink(filePath);
  }
}
