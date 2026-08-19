import { redirect } from "next/navigation";
import { getAdminNavAccess } from "@/lib/admin";
import type { Resource } from "@/config/resource-roles";

// Same order as the tabs in AdminNav.tsx (Users group — including its nested
// Permissions flyout — then Appeals, then Content) — first one the viewer
// can open wins.
const ADMIN_TAB_PATHS: [Resource, string][] = [
  ["users", "users"],
  ["whitelist", "whitelist"],
  ["badges", "badges"],
  ["ranks", "ranks"],
  ["role", "roles"],
  ["row-level-roles", "row-level-roles"],
  ["resource-roles", "resource-roles"],
  ["tickets", "tickets"],
  ["reports", "reports"],
  ["applications", "applications"],
  ["content", "content"],
  ["maps", "maps"],
  ["events", "events"],
];

/** /admin has no content of its own — redirects to the first tab the viewer can actually open (a resource-role holder might not have users-view), falling back to the home page if they hold none. */
export default async function AdminIndexPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const navAccess = await getAdminNavAccess();

  const firstAccessible = ADMIN_TAB_PATHS.find(([resource]) => navAccess[resource]);
  redirect(firstAccessible ? `/${lang}/admin/${firstAccessible[1]}` : `/${lang}`);
}
