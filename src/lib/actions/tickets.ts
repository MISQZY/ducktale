"use server";

import { saveAttachment } from "@/lib/attachments";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { siteDb } from "@/lib/site-db";
import { isRateLimited } from "@/lib/rate-limit";
import {
  getTicketViewer,
  canViewTicket,
  TICKET_SUBJECT_MAX,
  TICKET_MESSAGE_MAX,
  MAX_ATTACHMENT_BYTES,
  MAX_ATTACHMENT_MB,
  MAX_FILES_PER_MESSAGE,
} from "@/lib/tickets";

/**
 * isRateLimited() only reads req.headers.get(...), so the incoming-request
 * Headers from next/headers() (the only thing Server Actions get — there's
 * no raw Request object here, unlike a Route Handler) satisfies it through
 * this narrow shim without pulling in a second rate-limit implementation.
 */
async function rateLimitedByHeaders(routeKey: string, limit: number, windowMs: number): Promise<boolean> {
  const hdrs = await headers();
  return isRateLimited({ headers: hdrs } as unknown as Request, routeKey, limit, windowMs);
}

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

  const cleanSubject = (subject || "").trim().slice(0, TICKET_SUBJECT_MAX);
  const cleanMessage = (message || "").trim().slice(0, TICKET_MESSAGE_MAX);
  if (!cleanSubject || !cleanMessage) throw new Error("Subject and message are required");

  const validFiles = files.filter(f => f.size > 0);
  if (validFiles.length > MAX_FILES_PER_MESSAGE) {
    throw new Error(`Too many attachments, max ${MAX_FILES_PER_MESSAGE} per message`);
  }
  for (const file of validFiles) {
    if (file.size > MAX_ATTACHMENT_BYTES) {
      throw new Error(`File ${file.name} is too large. Max size is ${MAX_ATTACHMENT_MB}MB.`);
    }
  }

  if (await rateLimitedByHeaders("ticket-create", 5, 60 * 60_000)) {
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

  const ticket = await siteDb.ticket.findUnique({
    where: { id: ticketId },
    select: { id: true, userId: true },
  });
  if (!ticket || !canViewTicket(viewer, ticket)) throw new Error("Ticket not found");

  const cleanBody = (body || "").trim().slice(0, TICKET_MESSAGE_MAX);
  if (!cleanBody) throw new Error("Message is required");

  const validFiles = files.filter(f => f.size > 0);
  if (validFiles.length > MAX_FILES_PER_MESSAGE) {
    throw new Error(`Too many attachments, max ${MAX_FILES_PER_MESSAGE} per message`);
  }
  for (const file of validFiles) {
    if (file.size > MAX_ATTACHMENT_BYTES) {
      throw new Error(`File ${file.name} is too large. Max size is ${MAX_ATTACHMENT_MB}MB.`);
    }
  }

  if (await rateLimitedByHeaders("ticket-message", 20, 5 * 60_000)) {
    throw new Error("Too many messages, slow down");
  }

  const attachmentsData = [];
  for (const file of validFiles) {
    const saved = await saveAttachment(file);
    attachmentsData.push(saved);
  }

  const isAdminReply = viewer.isAdmin && viewer.id !== ticket.userId;

  await siteDb.$transaction([
    siteDb.ticketMessage.create({
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

  revalidatePath(`/${lang}/tickets/${ticketId}`);
  revalidatePath(`/${lang}/account/tickets`);
  revalidatePath(`/${lang}/admin/tickets`);
}

export async function setTicketStatus(lang: string, ticketId: string, status: "OPEN" | "CLOSED"): Promise<void> {
  const viewer = await getTicketViewer();
  if (!viewer?.isAdmin) throw new Error("Not authorized");

  await siteDb.ticket.update({ where: { id: ticketId }, data: { status } });

  revalidatePath(`/${lang}/tickets/${ticketId}`);
  revalidatePath(`/${lang}/admin/tickets`);
}
