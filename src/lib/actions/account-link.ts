"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { siteDb } from "@/lib/site-db";

/**
 * A real Server Action (not an inline form action) so it's callable both
 * from Server Components (bound as a <form action>) and imperatively from
 * Client Components (LinkAccountFlow, whose CONFIRMED view can appear via
 * client-side polling, not just the initial server render).
 */
export async function unlinkAccount(lang: string) {
  const session = await auth();
  if (!session?.user?.id) return;

  await siteDb.accountLink.deleteMany({ where: { userId: session.user.id } });

  revalidatePath(`/${lang}/account`);
  revalidatePath(`/${lang}/account/link`);
}
