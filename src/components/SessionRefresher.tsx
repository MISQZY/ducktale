"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "@/i18n/navigation";

/**
 * Re-renders the current Server Component tree (router.refresh()) whenever
 * the client session's identity/isAdmin/roles actually change — otherwise an
 * admin editing this user's Roles or isAdmin elsewhere doesn't show up until
 * a manual reload. session() (auth.ts) is always fresh per-request server-
 * side, but next-auth's client SessionProvider caches the session object and
 * only refetches on window focus by default (see next-auth's own docs) — and
 * even that refetch alone only updates client components reading useSession()
 * directly (e.g. Navbar's admin-panel link), not an already-rendered page's
 * own server-fetched props (canEdit/canDelete/roles baked in at render time),
 * which only pick up a change on navigation or an explicit refresh.
 *
 * Keyed on a derived string, not the session object itself — next-auth can
 * return a new object reference on every refetch even when nothing in it
 * actually changed, and refreshing the router on every such no-op refetch
 * would be wasted work (and a jarring flicker) for no reason.
 */
export function SessionRefresher() {
  const { data: session } = useSession();
  const router = useRouter();
  // `undefined` means "hasn't run yet" — distinct from `null`, which is a
  // legitimate key for an anonymous session. Using `null` for both (as this
  // previously did) silently swallowed the anonymous-to-logged-in
  // transition: prevKeyRef.current started at null, an anonymous session's
  // key is also null, so the very first login's key change (null -> real
  // session) was indistinguishable from "still the first run" and never
  // triggered a refresh — the exact case this component exists for.
  const prevKeyRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const key = session
      ? `${session.user?.id ?? ""}:${session.user?.isAdmin}:${(session.user?.roles ?? []).join(",")}`
      : null;

    // Skips the very first run (nothing to compare against yet) — only a
    // real change on a *subsequent* session read should trigger a refresh.
    if (prevKeyRef.current !== undefined && key !== prevKeyRef.current) {
      router.refresh();
    }
    prevKeyRef.current = key;
  }, [session, router]);

  return null;
}
