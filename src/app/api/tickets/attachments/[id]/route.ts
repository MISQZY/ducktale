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

  const attachment = await siteDb.ticketAttachment.findUnique({
    where: { id },
    include: {
      ticketMessage: {
        include: {
          ticket: {
            select: { userId: true, id: true }
          }
        }
      }
    }
  });

  if (!attachment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!canViewTicket(viewer, attachment.ticketMessage.ticket)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const filePath = join(UPLOADS_DIR, attachment.path);

  if (!existsSync(filePath)) {
    return NextResponse.json({ error: "File missing on disk" }, { status: 404 });
  }

  const fileStat = await stat(filePath);
  const stream = createReadStream(filePath);

  const headers = new Headers();
  headers.set(
    "Content-Type",
    attachment.mimeType && SAFE_CONTENT_TYPES.has(attachment.mimeType) ? attachment.mimeType : "application/octet-stream"
  );
  headers.set("Content-Length", fileStat.size.toString());
  // Always "attachment", never "inline" — this is what actually stops a
  // malicious upload (an .html/.svg-like file smuggled past the extension
  // allowlist, or a browser that sniffs content instead of trusting
  // Content-Type) from executing as script in this app's origin when an
  // admin opens the link. The Content-Type restriction above is
  // defense-in-depth on top of this, not a substitute for it.
  headers.set("Content-Disposition", `attachment; filename="${encodeURIComponent(attachment.filename)}"`);
  headers.set("X-Content-Type-Options", "nosniff");

  return new Response(Readable.toWeb(stream) as ReadableStream, {
    status: 200,
    headers,
  });
}
