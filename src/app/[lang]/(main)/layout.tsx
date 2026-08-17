import Navbar from "@/components/Navbar";
import { auth } from "@/auth";
import { hasPublicResourceRole } from "@/lib/public-access";
import { hasResourceRole } from "@/config/resource-roles";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Both computed here (Server Component) rather than inside Navbar itself
  // (client component, only sees session.user.roles — nothing for an
  // anonymous visitor's effective Guest-role grants) — see hasPublicResourceRole's
  // doc comment (src/lib/public-access.ts).
  const [session, canViewLeaderboard, canViewMaps, canViewEvents] = await Promise.all([
    auth(),
    hasPublicResourceRole("leaderboard-view"),
    hasPublicResourceRole("maps-page-view"),
    hasPublicResourceRole("events-page-view"),
  ]);
  // Threads has its own resource-role now (threads-view, seeded onto the
  // built-in "user" Role) but — unlike leaderboard — no anonymous/Guest
  // resolution: threads/layout.tsx's requireResourceRole always rejects a
  // no-session visitor outright, so this mirrors that exactly rather than
  // going through hasPublicResourceRole.
  const canViewThreads = !!session?.user?.id
    && (session.user.isAdmin || hasResourceRole(session.user.roles, "threads-view"));

  return (
    <>
      <Navbar canViewLeaderboard={canViewLeaderboard} canViewThreads={canViewThreads} canViewMaps={canViewMaps} canViewEvents={canViewEvents} />
      {children}
    </>
  );
}
