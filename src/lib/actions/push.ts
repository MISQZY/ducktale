"use server";

import { siteDb } from "@/lib/site-db";
import { auth } from "@/auth";

export interface PushSubscriptionInput {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export async function subscribeToPush(subscription: PushSubscriptionInput, userAgent?: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  // Upsert by endpoint (unique) — re-subscribing the same browser (e.g.
  // after a service worker update rotates its keys) updates the existing
  // row instead of creating a duplicate.
  await siteDb.pushSubscription.upsert({
    where: { endpoint: subscription.endpoint },
    create: {
      userId: session.user.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      userAgent: userAgent?.slice(0, 255),
    },
    update: {
      userId: session.user.id,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      userAgent: userAgent?.slice(0, 255),
    },
  });
}

/** Only ever deletes the caller's own subscription — same belt-and-suspenders `where: { ..., userId }` shape as markNotificationRead, against a forged endpoint. */
export async function unsubscribeFromPush(endpoint: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  await siteDb.pushSubscription.deleteMany({ where: { endpoint, userId: session.user.id } });
}
