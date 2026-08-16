import { NextResponse } from "next/server";
import { siteDb } from "@/lib/site-db";
import { getTicketViewer, canViewTicket } from "@/lib/tickets";
import { createReadStream, existsSync } from "fs";
import { Readable } from "stream";
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
  const stream = createReadStream(filePath);

  const headers = new Headers();
  const safeType = attachment.mimeType && SAFE_CONTENT_TYPES.has(attachment.mimeType) ? attachment.mimeType : "application/octet-stream";
  headers.set("Content-Type", safeType);
  headers.set("Content-Length", fileStat.size.toString());
  // Allow inline rendering for images so they display in <img> tags.
  // Other file types are forced to "attachment" to prevent script execution
  // from uploads smuggled past the extension allowlist.
  const isInlineImage = safeType.startsWith("image/");
  headers.set(
    "Content-Disposition",
    `${isInlineImage ? "inline" : "attachment"}; filename="${encodeURIComponent(attachment.filename)}"`
  );
  headers.set("X-Content-Type-Options", "nosniff");

  return new Response(Readable.toWeb(stream) as ReadableStream, {
    status: 200,
    headers,
  });
}
