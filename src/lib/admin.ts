import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { RESOURCE_ROLE_ACTIONS, hasResourceRole, type Resource, type ResourceRole } from "@/config/resource-roles";

/**
 * session.user.isAdmin comes from auth.ts's session() callback, which
 * re-reads it from the DB on every session read rather than trusting a
 * cached JWT claim — so this is still live per-request, not stale until
 * the user's token happens to refresh.
 */
export async function requireAdmin(lang: string) {
  const session = await auth();
  if (!session?.user?.id) redirect(`/${lang}/account/login`);

  // Insufficient permission (as opposed to no session at all, above) sends
  // the viewer to the home page, not /profile — there's nothing there for
  // them to do about it, home is just a neutral "somewhere that works".
  if (!session.user.isAdmin) redirect(`/${lang}`);
  return session.user;
}

/** Same DB check as requireAdmin, but throws instead of redirecting — for use inside Server Actions, which are directly callable and have no page to redirect away from. */
export async function requireAdminId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  if (!session.user.isAdmin) throw new Error("Not authorized");
  return session.user.id;
}

/** Resource-role equivalent of requireAdmin — redirects unless the viewer is a superadmin (isAdmin bypasses every resource-role check) or holds `role` themselves. */
export async function requireResourceRole(lang: string, role: ResourceRole) {
  const session = await auth();
  if (!session?.user?.id) redirect(`/${lang}/account/login`);

  // Same "insufficient permission -> home, not /profile" reasoning as
  // requireAdmin above.
  if (!session.user.isAdmin && !hasResourceRole(session.user.roles, role)) redirect(`/${lang}`);
  return session.user;
}

/** Same as requireResourceRole, but throws instead of redirecting — for Server Actions, same split as requireAdminId. */
export async function requireResourceRoleId(role: ResourceRole): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  if (!session.user.isAdmin && !hasResourceRole(session.user.roles, role)) throw new Error("Not authorized");
  return session.user.id;
}

/**
 * Which admin resources (nav tabs) the current viewer can at least view —
 * drives AdminNav's tab visibility and admin/page.tsx's landing redirect (no
 * longer hardcoded to /admin/users now that a viewer might lack users-view).
 * Checks the exact same resource-role each admin page's own
 * requireResourceRole(lang, "<resource>-view") call requires — `-view` for
 * every resource that has one, `-edit` for the one that doesn't (`content`,
 * gated on `content-edit` directly, see RESOURCE_ROLE_ACTIONS's doc
 * comment). Deliberately **not** "holds any action for this resource" —
 * `-edit` no longer implies `-view` (see hasResourceRole's doc comment), so
 * an edit-only holder of e.g. `badges-edit` (no `badges-view`) would show
 * the nav tab but then get redirected away from the page the moment they
 * clicked it, if this checked anything looser than the page's real gate.
 */
export async function getAdminNavAccess(): Promise<Record<Resource, boolean>> {
  const session = await auth();
  const isAdmin = session?.user?.isAdmin ?? false;
  const roles = session?.user?.roles ?? [];

  const access = {} as Record<Resource, boolean>;
  for (const resource of Object.keys(RESOURCE_ROLE_ACTIONS) as Resource[]) {
    const actions = RESOURCE_ROLE_ACTIONS[resource] as readonly string[];
    const gateAction = actions.includes("view") ? "view" : "edit";
    access[resource] = isAdmin || hasResourceRole(roles, `${resource}-${gateAction}` as ResourceRole);
  }
  return access;
}

// Resources with a real /admin nav tab (AdminNav.tsx's own `tabs` list,
// admin/page.tsx's ADMIN_TAB_PATHS) — narrower than every key
// getAdminNavAccess() returns, since a few resources (docs/leaderboard/
// profiles/server-status/maps-page/threads) gate public or non-admin-panel
// surfaces instead and have no nav tab to open.
const ADMIN_PAGE_RESOURCES: Resource[] = ["users", "content", "tickets", "badges", "ranks", "role", "row-level-roles", "resource-roles", "maps", "events", "reports", "applications"];

/**
 * True if the viewer holds an actual `-view` resource-role (or isAdmin) on
 * at least one admin-panel resource — used by the profile page's "Admin
 * panel" quick-link to decide whether to show that link at all. Narrower
 * than getAdminNavAccess() above: this only counts a real `-view` grant, not
 * "-edit as a substitute" — `content` (the one admin resource with no
 * `-view` action at all, gated on `content-edit` directly) never
 * contributes here, so a content-edit-only holder with no other admin
 * resource-role won't see the icon, even though /admin/content itself is
 * still reachable for them. Deliberate: the icon means "you have something
 * to *look at* in the admin panel", not just "some admin URL happens to be
 * reachable for you".
 */
export async function hasAdminNavAccess(): Promise<boolean> {
  const session = await auth();
  if (session?.user?.isAdmin) return true;
  const roles = session?.user?.roles ?? [];

  return ADMIN_PAGE_RESOURCES.some((resource) => {
    const actions = RESOURCE_ROLE_ACTIONS[resource] as readonly string[];
    return actions.includes("view") && hasResourceRole(roles, `${resource}-view` as ResourceRole);
  });
}

