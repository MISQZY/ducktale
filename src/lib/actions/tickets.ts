"use server";

import { saveAttachment, deleteAttachmentFile } from "@/lib/attachments";

import { revalidatePath } from "next/cache";
import { siteDb } from "@/lib/site-db";
import { isRateLimitedByHeaders } from "@/lib/rate-limit";
import { createNotification } from "@/lib/notifications";
import {
  getTicketViewer,
  canViewTicket,
  isTicketStaff,
  isTicketEditor,
  isTicketDeleter,
  TICKET_SUBJECT_MAX,
  TICKET_MESSAGE_MAX,
  MAX_ATTACHMENT_BYTES,
  MAX_ATTACHMENT_MB,
  MAX_FILES_PER_MESSAGE,
} from "@/lib/tickets";

export interface CreateTicketResult {
  id: string;
}

export async function createTicket(formData: FormData): Promise<CreateTicketResult> {
  const viewer = await getTicketViewer();
  if (!viewer) throw new Error("Not authenticated");

  const lang = formData.get("lang") as string;
  const subject = formData.get("subject") as string;
  const message = formData.get("message") as string;
  const files = formData.getAll("files") as File[];
  const validFiles = files.filter(f => f.size > 0);

  const cleanSubject = (subject || "").trim().slice(0, TICKET_SUBJECT_MAX);
  // Message is only required when there's no attachment to carry the report
  // instead — an attachment-only ticket ("here's a screenshot of the bug")
  // is a legitimate submission, same reasoning as sendTicketMessage below.
  const cleanMessage = (message || "").trim().slice(0, TICKET_MESSAGE_MAX);
  if (!cleanSubject || (!cleanMessage && validFiles.length === 0)) {
    throw new Error("Subject and message are required");
  }

  if (validFiles.length > MAX_FILES_PER_MESSAGE) {
    throw new Error(`Too many attachments, max ${MAX_FILES_PER_MESSAGE} per message`);
  }
  for (const file of validFiles) {
    if (file.size > MAX_ATTACHMENT_BYTES) {
      throw new Error(`File ${file.name} is too large. Max size is ${MAX_ATTACHMENT_MB}MB.`);
    }
  }

  if (await isRateLimitedByHeaders("ticket-create", 5, 60 * 60_000)) {
    throw new Error("Too many tickets created, try again later");
  }

  const attachmentsData = [];
  for (const file of validFiles) {
    const saved = await saveAttachment(file);
    attachmentsData.push(saved);
  }

  const ticket = await siteDb.ticket.create({
    data: {
      userId: viewer.id,
      subject: cleanSubject,
      messages: { 
        create: { 
          authorId: viewer.id, 
          body: cleanMessage, 
          isAdminReply: false,
          attachments: attachmentsData.length > 0 ? {
            create: attachmentsData.map(a => ({
              filename: a.filename,
              size: a.size,
              mimeType: a.mimeType,
              path: a.path
            }))
          } : undefined
        } 
      },
    },
    select: { id: true },
  });

  revalidatePath(`/${lang}/account/tickets`);
  return { id: ticket.id };
}

export async function sendTicketMessage(formData: FormData): Promise<void> {
  const viewer = await getTicketViewer();
  if (!viewer) throw new Error("Not authenticated");

  const lang = formData.get("lang") as string;
  const ticketId = formData.get("ticketId") as string;
  const body = formData.get("body") as string;
  const files = formData.getAll("files") as File[];
  const validFiles = files.filter(f => f.size > 0);

  const ticket = await siteDb.ticket.findUnique({
    where: { id: ticketId },
    select: { id: true, userId: true, status: true, subject: true },
  });
  if (!ticket || !canViewTicket(viewer, ticket)) throw new Error("Ticket not found");

  // Empty body is fine as long as there's an attachment — matches
  // TicketThread.tsx's own submitMessage guard (!trimmed && files.length === 0).
  const cleanBody = (body || "").trim().slice(0, TICKET_MESSAGE_MAX);
  if (!cleanBody && validFiles.length === 0) throw new Error("Message is required");

  if (validFiles.length > MAX_FILES_PER_MESSAGE) {
    throw new Error(`Too many attachments, max ${MAX_FILES_PER_MESSAGE} per message`);
  }
  for (const file of validFiles) {
    if (file.size > MAX_ATTACHMENT_BYTES) {
      throw new Error(`File ${file.name} is too large. Max size is ${MAX_ATTACHMENT_MB}MB.`);
    }
  }

  if (await isRateLimitedByHeaders("ticket-message", 20, 5 * 60_000)) {
    throw new Error("Too many messages, slow down");
  }

  const attachmentsData = [];
  for (const file of validFiles) {
    const saved = await saveAttachment(file);
    attachmentsData.push(saved);
  }

  // isTicketStaff, not isTicketEditor — this flag drives which side of the
  // thread the message renders on (TicketThread.tsx's alignRight/isStaff),
  // so it must track the same "is staff" definition as the rest of the UI,
  // not the narrower tickets-edit permission.
  const isAdminReply = isTicketStaff(viewer) && viewer.id !== ticket.userId;
  // A reply on a CLOSED ticket implicitly reopens it (see closedHint in the
  // Tickets i18n namespace) — unlike Thread, which just rejects new messages
  // outright until explicitly reopened via setThreadClosed. Recorded as the
  // same REOPENED event row setTicketStatus writes for the explicit
  // reopen-button case, so the timeline doesn't have a gap where the status
  // visibly changes with nothing marking why.
  const reopened = ticket.status === "CLOSED";

  await siteDb.$transaction([
    ...(reopened ? [siteDb.message.create({
      // isAdminReply reused from below — same actor, same anonymization
      // rule (ticket-data.ts nulls a staff-authored row's skin from a
      // non-staff viewer) needs to apply to this event row too, not just
      // real messages.
      data: { ticketId, authorId: viewer.id, type: "REOPENED", isAdminReply, body: "" },
    })] : []),
    siteDb.message.create({
      data: {
        ticketId,
        authorId: viewer.id,
        body: cleanBody,
        isAdminReply,
        attachments: attachmentsData.length > 0 ? {
          create: attachmentsData.map(a => ({
            filename: a.filename,
            size: a.size,
            mimeType: a.mimeType,
            path: a.path
          }))
        } : undefined
      },
    }),
    siteDb.ticket.update({
      where: { id: ticketId },
      data: { status: isAdminReply ? "ANSWERED" : "OPEN" },
    }),
  ]);

  // Only the ticket owner, and only for a staff reply — a reply from the
  // owner themselves doesn't need to notify... themselves.
  if (isAdminReply) {
    await createNotification(ticket.userId, "ticket_reply", { ticketId, ticketSubject: ticket.subject });
  }

  revalidatePath(`/${lang}/tickets/${ticketId}`);
  revalidatePath(`/${lang}/account/tickets`);
  revalidatePath(`/${lang}/admin/tickets`);
}

/**
 * Toggles Ticket.status between OPEN and CLOSED (the explicit staff
 * close/reopen button — see isTicketEditor gating). Records the toggle as a
 * CLOSED/REOPENED Message row in the same transaction, same as
 * setThreadClosed in src/lib/actions/threads.ts, so it lands in the
 * timeline at its correct chronological position alongside real messages.
 */
export async function setTicketStatus(lang: string, ticketId: string, status: "OPEN" | "CLOSED"): Promise<void> {
  const viewer = await getTicketViewer();
  if (!viewer || !isTicketEditor(viewer)) throw new Error("Not authorized");

  const ticket = await siteDb.ticket.findUnique({ where: { id: ticketId }, select: { userId: true, subject: true } });
  if (!ticket) throw new Error("Ticket not found");

  await siteDb.$transaction([
    siteDb.ticket.update({ where: { id: ticketId }, data: { status } }),
    siteDb.message.create({
      data: {
        ticketId,
        authorId: viewer.id,
        type: status === "CLOSED" ? "CLOSED" : "REOPENED",
        // Same self-ticket exclusion sendTicketMessage's isAdminReply
        // applies — isTicketEditor already guarantees staff here, this only
        // matters for the rare case a staffer closes/reopens their own
        // ticket, where anonymizing themselves from themselves would be odd.
        isAdminReply: viewer.id !== ticket.userId,
        body: "",
      },
    }),
  ]);

  // Same self-ticket exclusion as above — a staffer closing their own
  // ticket doesn't need to be told they just did that.
  if (status === "CLOSED" && viewer.id !== ticket.userId) {
    await createNotification(ticket.userId, "ticket_closed", { ticketId, ticketSubject: ticket.subject });
  }

  revalidatePath(`/${lang}/tickets/${ticketId}`);
  revalidatePath(`/${lang}/admin/tickets`);
}

export async function deleteTicket(lang: string, ticketId: string): Promise<void> {
  const viewer = await getTicketViewer();
  if (!viewer || !isTicketDeleter(viewer)) throw new Error("Not authorized");

  const attachments = await siteDb.messageAttachment.findMany({
    where: { message: { ticketId } },
    select: { path: true },
  });

  // Message/MessageAttachment rows cascade via the schema's onDelete: Cascade.
  await siteDb.ticket.delete({ where: { id: ticketId } });

  await Promise.all(attachments.map((a) => deleteAttachmentFile(a.path).catch(() => {})));

  revalidatePath(`/${lang}/admin/tickets`);
  revalidatePath(`/${lang}/account/tickets`);
}
