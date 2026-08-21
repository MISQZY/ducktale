import { NextResponse } from "next/server";
import { siteDb } from "@/lib/site-db";
import { getTicketViewer, canViewTicket } from "@/lib/tickets";
import { serveAttachmentFile } from "@/lib/serve-attachment";
import { existsSync } from "fs";
import { join } from "path";
import { stat } from "fs/promises";

const UPLOADS_DIR = join(process.cwd(), "uploads", "attachments");

// Only types that are safe to hand a browser as Content-Type even in the
// worst case — everything else (including anything that slipped past
// attachments.ts's own extension allowlist some other way) gets served as
// application/octet-stream instead of trusting the attacker-suppliable
// stored value.
const SAFE_CONTENT_TYPES = new Set([
  "image/png", "image/jpeg", "image/gif", "image/webp",
  "application/pdf",
  "text/plain",
  "video/mp4", "video/webm", "video/quicktime",
  "application/zip",
  "application/java-archive", "application/x-java-archive",
]);

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const viewer = await getTicketViewer();
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const attachment = await siteDb.messageAttachment.findUnique({
    where: { id },
    include: {
      message: {
        include: {
          ticket: {
            select: { userId: true, id: true }
          }
        }
      }
    }
  });

  // The .ticket null check also covers a MessageAttachment that somehow
  // pointed at a thread message instead — attachments are only ever created
  // on ticket messages (see saveAttachment's callers), but the relation is
  // optional at the schema level since Message is shared with Thread.
  if (!attachment || !attachment.message.ticket) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!canViewTicket(viewer, attachment.message.ticket)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const filePath = join(UPLOADS_DIR, attachment.path);

  if (!existsSync(filePath)) {
    return NextResponse.json({ error: "File missing on disk" }, { status: 404 });
  }

  const fileStat = await stat(filePath);

  const safeType = attachment.mimeType && SAFE_CONTENT_TYPES.has(attachment.mimeType) ? attachment.mimeType : "application/octet-stream";
  // Allow inline rendering for images/videos so they display in <img>/<video>
  // tags. Other file types are forced to "attachment" to prevent script
  // execution from uploads smuggled past the extension allowlist.
  const isInlineMedia = safeType.startsWith("image/") || safeType.startsWith("video/");

  return serveAttachmentFile(req, filePath, fileStat.size, safeType, isInlineMedia ? "inline" : "attachment", attachment.filename);
}
