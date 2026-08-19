"use server";

import { siteDb } from "@/lib/site-db";
import { revalidatePath } from "next/cache";
import { getSiteViewer } from "@/lib/site-viewer";
import { hasResourceRole } from "@/config/resource-roles";

export async function deleteMessage(lang: string, messageId: string, pathToRevalidate: string): Promise<void> {
  const viewer = await getSiteViewer();
  if (!viewer) throw new Error("Not authenticated");

  const message = await siteDb.message.findUnique({
    where: { id: messageId },
    select: { 
      id: true, 
      authorId: true, 
      ticketId: true, 
      reportId: true, 
      applicationId: true, 
      threadId: true 
    }
  });

  if (!message) throw new Error("Message not found");

  const isAuthor = viewer.id === message.authorId;
  let canDeleteAsAdmin = viewer.isAdmin;

  if (!canDeleteAsAdmin) {
    if (message.ticketId && hasResourceRole(viewer.roles, "tickets-delete")) canDeleteAsAdmin = true;
    else if (message.reportId && hasResourceRole(viewer.roles, "reports-delete")) canDeleteAsAdmin = true;
    else if (message.applicationId && hasResourceRole(viewer.roles, "applications-delete")) canDeleteAsAdmin = true;
    else if (message.threadId && hasResourceRole(viewer.roles, "threads-delete")) canDeleteAsAdmin = true;
  }

  if (!isAuthor && !canDeleteAsAdmin) {
    throw new Error("Not authorized to delete this message");
  }

  await siteDb.message.update({
    where: { id: messageId },
    data: { isDeleted: true }
  });

  revalidatePath(pathToRevalidate);
}
