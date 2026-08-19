"use server";

import { revalidatePath } from "next/cache";
import { saveAttachment, deleteAttachmentFile } from "@/lib/attachments";
import { siteDb } from "@/lib/site-db";
import { getInitialStatusId } from "@/lib/workflows";
import { isRateLimitedByHeaders } from "@/lib/rate-limit";
import {
  getThreadViewer,
  hasThreadAccess,
  isThreadModerator,
  isThreadDeleter,
  THREAD_TITLE_MAX,
  THREAD_DESCRIPTION_MAX,
  THREAD_MESSAGE_MAX,
  MAX_FILES_PER_MESSAGE,
} from "@/lib/threads";

const MAX_ATTACHMENT_MB = Math.min(Math.max(Number(process.env.MAX_TICKET_ATTACHMENT_MB) || 20, 1), 50);
const MAX_ATTACHMENT_BYTES = MAX_ATTACHMENT_MB * 1024 * 1024;

export interface CreateThreadResult {
  id: string;
}

export async function createThread(formData: FormData): Promise<CreateThreadResult> {
  const viewer = await getThreadViewer();
  if (!viewer || !hasThreadAccess(viewer)) throw new Error("Not authorized");

  const lang = formData.get("lang") as string;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string | null;
  const message = formData.get("message") as string;

  const cleanTitle = (title || "").trim().slice(0, THREAD_TITLE_MAX);
  const cleanDescription = (description || "").trim().slice(0, THREAD_DESCRIPTION_MAX);
  const cleanMessage = (message || "").trim().slice(0, THREAD_MESSAGE_MAX);
  if (!cleanTitle || !cleanMessage) throw new Error("Title and message are required");

  if (await isRateLimitedByHeaders("thread-create", 5, 60 * 60_000)) {
    throw new Error("Too many threads created, try again later");
  }

  const statusId = await getInitialStatusId("THREAD");
  const thread = await siteDb.thread.create({
    data: {
      statusId,
      authorId: viewer.id,
      title: cleanTitle,
      description: cleanDescription || null,
      messages: { create: { authorId: viewer.id, body: cleanMessage } },
    },
    select: { id: true },
  });

  revalidatePath(`/${lang}/threads`, "layout");
  return { id: thread.id };
}

export async function sendThreadMessage(formData: FormData): Promise<void> {
  const viewer = await getThreadViewer();
  if (!viewer || !hasThreadAccess(viewer)) throw new Error("Not authorized");

  const lang = formData.get("lang") as string;
  const threadId = formData.get("threadId") as string;
  const body = formData.get("body") as string;
  const files = formData.getAll("files") as File[];
  const validFiles = files.filter(f => f.size > 0);

  const cleanBody = (body || "").trim().slice(0, THREAD_MESSAGE_MAX);
  if (!cleanBody && validFiles.length === 0) throw new Error("Message is required");

  if (validFiles.length > MAX_FILES_PER_MESSAGE) {
    throw new Error(`Too many attachments, max ${MAX_FILES_PER_MESSAGE} per message`);
  }
  for (const file of validFiles) {
    if (file.size > MAX_ATTACHMENT_BYTES) {
      throw new Error(`File ${file.name} is too large. Max size is ${MAX_ATTACHMENT_MB}MB.`);
    }
  }

  const attachmentsData: any[] = [];
  for (const file of validFiles) {
    const saved = await saveAttachment(file);
    attachmentsData.push(saved);
  }

  if (await isRateLimitedByHeaders("thread-message", 20, 5 * 60_000)) {
    throw new Error("Too many messages, slow down");
  }

  // Every authenticated user can reply to every thread (see getThreadViewer's
  // doc comment) — the only gate here is "does the thread still exist" and
  // "isn't closed" (closing is the one thing that blocks new messages;
  // reopening it back is the only way to lift that, via setThreadClosed).
  //
  // The existence/closed check and the message insert run in one
  // interactive transaction, and the check is an updateMany (not a plain
  // findUnique) specifically so it takes the same row lock setThreadClosed's
  // own update does — without that, a close() landing in the gap between a
  // separate read-check and this insert could let a message through right
  // after the thread was closed. updateMany's `data` reuses the updatedAt
  // bump this write already needed (so the tree's date grouping reflects
  // the thread's latest activity), rather than being a no-op check.
  await siteDb.$transaction(async (tx) => {
    const { count } = await tx.thread.updateMany({
      where: { id: threadId, closed: false },
      data: { updatedAt: new Date() },
    });
    if (count === 0) {
      const exists = await tx.thread.findUnique({ where: { id: threadId }, select: { id: true } });
      throw new Error(exists ? "Thread is closed" : "Thread not found");
    }

    await tx.message.create({
      data: { 
          threadId, 
          authorId: viewer.id, 
          body: cleanBody,
          attachments: attachmentsData.length > 0 ? {
            create: attachmentsData.map(a => ({
              filename: a.filename,
              size: a.size,
              mimeType: a.mimeType,
              path: a.path
            }))
          } : undefined
        },
    });
  });

  revalidatePath(`/${lang}/threads/${threadId}`);
  revalidatePath(`/${lang}/threads`, "layout");
}

/**
 * Toggles Thread.closed — the author or any admin can call this (unlike
 * deleteThread, which is admin-only). Records the toggle as a
 * CLOSED/REOPENED Message row in the same transaction, so it lands in
 * the timeline at its correct chronological position alongside real
 * messages (see the Message.type doc comment in the schema — the same
 * pattern setTicketStatus in src/lib/actions/tickets.ts uses).
 */
export async function setThreadClosed(lang: string, threadId: string, closed: boolean): Promise<void> {
  const viewer = await getThreadViewer();
  if (!viewer || !hasThreadAccess(viewer)) throw new Error("Not authorized");

  const thread = await siteDb.thread.findUnique({
    where: { id: threadId },
    select: { id: true, authorId: true },
  });
  if (!thread) throw new Error("Thread not found");
  if (viewer.id !== thread.authorId && !isThreadModerator(viewer)) throw new Error("Not authorized");

  const targetStatus = await siteDb.workflowStatus.findFirst({ where: { target: "THREAD", isClosed: closed }, select: { id: true } });
  if (!targetStatus) throw new Error("Status not found");
  
  await siteDb.$transaction([
    siteDb.thread.update({
      where: { id: threadId },
      data: { statusId: targetStatus.id },
    }),
    siteDb.message.create({
      data: { threadId, authorId: viewer.id, type: "STATUS_CHANGED", body: "" },
    }),
  ]);

  revalidatePath(`/${lang}/threads/${threadId}`);
  revalidatePath(`/${lang}/threads`, "layout");
}

export async function deleteThread(lang: string, threadId: string): Promise<void> {
  const viewer = await getThreadViewer();
  if (!viewer || !isThreadDeleter(viewer)) throw new Error("Not authorized");

  const thread = await siteDb.thread.findUnique({ where: { id: threadId }, select: { id: true } });
  if (!thread) throw new Error("Thread not found");

  // Message rows cascade via the schema's onDelete: Cascade.
  const attachments = await siteDb.messageAttachment.findMany({
    where: { message: { threadId } },
    select: { path: true },
  });

  await siteDb.thread.delete({ where: { id: threadId } });

  await Promise.all(attachments.map((a) => deleteAttachmentFile(a.path).catch(() => {})));

  revalidatePath(`/${lang}/threads`, "layout");
}
