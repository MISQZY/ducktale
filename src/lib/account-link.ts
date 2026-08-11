import { siteDb } from "@/lib/site-db";
import { generateLinkCode, LINK_CODE_TTL_MS } from "@/lib/link-code";
import type { LinkStatus } from ".prisma/site-client";

/** Split out of the page component so the Date.now() call isn't inline in a component body (react-hooks/purity). */
export function isUsablePendingCode(link: { status: LinkStatus; expiresAt: Date } | null | undefined): boolean {
  return link?.status === "PENDING" && link.expiresAt.getTime() > Date.now();
}

/**
 * (Re)issues a link code for this user, resetting any existing row back to
 * PENDING — including overwriting a previously CONFIRMED link. Shared by
 * the request API route and the /account/link page itself (which generates
 * a code server-side so the code shows up immediately, no extra click).
 */
export async function requestNewLinkCode(userId: string) {
  const code = generateLinkCode();
  const expiresAt = new Date(Date.now() + LINK_CODE_TTL_MS);

  return siteDb.accountLink.upsert({
    where: { userId },
    update: {
      code,
      minecraftName: null,
      minecraftUuid: null,
      status: "PENDING",
      expiresAt,
      confirmedAt: null,
    },
    create: { userId, code, expiresAt },
    select: { status: true, code: true, minecraftName: true, expiresAt: true },
  });
}
