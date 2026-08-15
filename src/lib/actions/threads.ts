"use server";

import { revalidatePath } from "next/cache";
import { siteDb } from "@/lib/site-db";
import { isRateLimitedByHeaders } from "@/lib/rate-limit";
import {
  getThreadViewer,
  THREAD_TITLE_MAX,
  THREAD_DESCRIPTION_MAX,
  THREAD_MESSAGE_MAX,
} from "@/lib/threads";

export interface CreateThreadResult {
  id: string;
}

export async function createThread(formData: FormData): Promise<CreateThreadResult> {
  const viewer = await getThreadViewer();
  if (!viewer) throw new Error("Not authenticated");

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

  const thread = await siteDb.thread.create({
    data: {
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
  if (!viewer) throw new Error("Not authenticated");

  const lang = formData.get("lang") as string;
  const threadId = formData.get("threadId") as string;
  const body = formData.get("body") as string;

  const thread = await siteDb.thread.findUnique({
    where: { id: threadId },
    select: { id: true, closed: true },
  });
  // Every authenticated user can reply to every thread (see getThreadViewer's
  // doc comment) — the only gate here is "does the thread still exist" and
  // "isn't closed" (closing is the one thing that blocks new messages;
  // reopening it back is the only way to lift that, via setThreadClosed).
  if (!thread) throw new Error("Thread not found");
  if (thread.closed) throw new Error("Thread is closed");

  const cleanBody = (body || "").trim().slice(0, THREAD_MESSAGE_MAX);
  if (!cleanBody) throw new Error("Message is required");

  if (await isRateLimitedByHeaders("thread-message", 20, 5 * 60_000)) {
    throw new Error("Too many messages, slow down");
  }

  await siteDb.$transaction([
    siteDb.threadMessage.create({
      data: { threadId, authorId: viewer.id, body: cleanBody },
    }),
    // Bumps updatedAt (@updatedAt only fires on a write that touches the
    // row) so the tree's date grouping reflects the thread's latest
    // activity, not just its creation time.
    siteDb.thread.update({
      where: { id: threadId },
      data: { updatedAt: new Date() },
    }),
  ]);

  revalidatePath(`/${lang}/threads/${threadId}`);
  revalidatePath(`/${lang}/threads`, "layout");
}

/**
 * Toggles Thread.closed — the author or any admin can call this (unlike
 * deleteThread, which is admin-only). Records the toggle as a
 * CLOSED/REOPENED ThreadMessage row in the same transaction, so it lands in
 * the timeline at its correct chronological position alongside real
 * messages (see the ThreadMessage.type doc comment in the schema).
 */
export async function setThreadClosed(lang: string, threadId: string, closed: boolean): Promise<void> {
  const viewer = await getThreadViewer();
  if (!viewer) throw new Error("Not authenticated");

  const thread = await siteDb.thread.findUnique({
    where: { id: threadId },
    select: { id: true, authorId: true },
  });
  if (!thread) throw new Error("Thread not found");
  if (viewer.id !== thread.authorId && !viewer.isAdmin) throw new Error("Not authorized");

  await siteDb.$transaction([
    siteDb.thread.update({
      where: { id: threadId },
      data: { closed },
    }),
    siteDb.threadMessage.create({
      data: { threadId, authorId: viewer.id, type: closed ? "CLOSED" : "REOPENED", body: "" },
    }),
  ]);

  revalidatePath(`/${lang}/threads/${threadId}`);
  revalidatePath(`/${lang}/threads`, "layout");
}

export async function deleteThread(lang: string, threadId: string): Promise<void> {
  const viewer = await getThreadViewer();
  if (!viewer?.isAdmin) throw new Error("Not authorized");

  // ThreadMessage rows cascade via the schema's onDelete: Cascade.
  await siteDb.thread.delete({ where: { id: threadId } });

  revalidatePath(`/${lang}/threads`, "layout");
}
