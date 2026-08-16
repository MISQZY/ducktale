"use server";

import { auth } from "@/auth";
import {
  markNotificationRead as markRead,
  markAllNotificationsRead as markAllRead,
  deleteReadNotifications as deleteRead,
} from "@/lib/notifications";

export async function markNotificationRead(id: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  await markRead(session.user.id, id);
}

export async function markAllNotificationsRead(): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  await markAllRead(session.user.id);
}

export async function deleteReadNotifications(): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  await deleteRead(session.user.id);
}
