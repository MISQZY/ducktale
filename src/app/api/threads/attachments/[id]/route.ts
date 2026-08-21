import { NextResponse } from "next/server";
import { siteDb } from "@/lib/site-db";
import { getThreadViewer, hasThreadAccess } from "@/lib/threads";
import { serveAttachmentFile } from "@/lib/serve-attachment";
import { existsSync } from "fs";
import { join } from "path";
import { stat } from "fs/promises";

const UPLOADS_DIR = join(process.cwd(), "uploads", "attachments");

const SAFE_CONTENT_TYPES = new Set([
  "image/png", "image/jpeg", "image/gif", "image/webp",
  "application/pdf",
  "text/plain",
  "video/mp4", "video/webm", "video/quicktime",
  "application/zip",
  "application/java-archive", "application/x-java-archive",
]);

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const viewer = await getThreadViewer();
  if (!viewer || !hasThreadAccess(viewer)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const attachment = await siteDb.messageAttachment.findUnique({
    where: { id },
    include: {
      message: {
        include: {
          thread: {
            select: { id: true }
          }
        }
      }
    }
  });

  if (!attachment || !attachment.message.thread) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const filePath = join(UPLOADS_DIR, attachment.path);

  if (!existsSync(filePath)) {
    return NextResponse.json({ error: "File missing on disk" }, { status: 404 });
  }

  const fileStat = await stat(filePath);

  const safeType = attachment.mimeType && SAFE_CONTENT_TYPES.has(attachment.mimeType) ? attachment.mimeType : "application/octet-stream";
  const isInlineMedia = safeType.startsWith("image/") || safeType.startsWith("video/");

  return serveAttachmentFile(req, filePath, fileStat.size, safeType, isInlineMedia ? "inline" : "attachment", attachment.filename);
}
