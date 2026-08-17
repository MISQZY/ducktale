import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { siteDb } from "@/lib/site-db";
import { withCache, invalidateByPrefix } from "@/lib/query-cache";
import { hasResourceRole, type ResourceRole } from "@/config/resource-roles";
import { resolveEffectiveResourceRoles } from "@/lib/roles";

export const GUEST_CACHE_PREFIX = "guest-resource-roles";
const GUEST_CACHE_TTL_MS = 60_000;

/** The built-in "guest" Role's effective resource-roles (own grants + anything it transitively includes) — what an unauthenticated visitor gets. Cached (query-cache.ts, same TTL pattern luckperms.ts uses) since this is read on every anonymous request to a gated public page; busted from admin-roles.ts whenever any Role write could have changed it. */
export async function getGuestResourceRoles(): Promise<string[]> {
  return withCache(GUEST_CACHE_PREFIX, GUEST_CACHE_TTL_MS, async () => {
    const guest = await siteDb.role.findUnique({ where: { key: "guest" }, select: { id: true } });
    if (!guest) return [];
    return [...(await resolveEffectiveResourceRoles([guest.id]))];
  });
}

export function invalidateGuestResourceRolesCache(): void {
  invalidateByPrefix(GUEST_CACHE_PREFIX);
}

/**
 * Resource-role gate for pages that stay reachable when logged out — the
 * public-access sibling of requireResourceRole (src/lib/admin.ts), which
 * every authenticated-only surface keeps using unchanged (no session there
 * is always a reject). Here, no session instead resolves through the
 * built-in "guest" Role: if Guest holds `role`, the page renders for
 * anonymous visitors exactly as it did before this gate existed; if not,
 * they're sent to log in the same way an authenticated viewer lacking the
 * role would be.
 */
export async function requirePublicResourceRole(lang: string, role: ResourceRole): Promise<void> {
  const session = await auth();
  if (session?.user?.id) {
    // Already logged in and still lacking the role — sending them to the
    // login page again would be pointless, they're not missing a session,
    // they're missing a permission. Home is the neutral fallback (same as
    // requireAdmin/requireResourceRole, src/lib/admin.ts).
    if (!session.user.isAdmin && !hasResourceRole(session.user.roles, role)) redirect(`/${lang}`);
    return;
  }

  // No session at all is the one case that's still genuinely "go log in" —
  // unlike the branch above, becoming authenticated is a real path to
  // possibly gaining the role.
  const guestRoles = await getGuestResourceRoles();
  if (!hasResourceRole(guestRoles, role)) redirect(`/${lang}/account/login`);
}

import { type Session } from "next-auth";

/** Same resolution as requirePublicResourceRole, but returns a boolean instead of redirecting — for API routes (src/app/api/server-status/*), which respond with a JSON error (or, for server-status, a version-only response — see that route) rather than a page redirect. */
export async function hasPublicResourceRole(role: ResourceRole, providedSession?: Session | null): Promise<boolean> {
  const session = providedSession !== undefined ? providedSession : await auth();
  if (session?.user?.id) {
    return session.user.isAdmin || hasResourceRole(session.user.roles, role);
  }

  const guestRoles = await getGuestResourceRoles();
  return hasResourceRole(guestRoles, role);
}
