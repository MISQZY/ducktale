"use client";

import { ThemeToggle } from "./ThemeToggle";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Link, usePathname } from "@/i18n/navigation";
import { Menu, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import Logo from "./ui/Logo";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PlayerAvatar } from "@/components/common/PlayerAvatar";
import { getCachedAvatar, getCachedAvatarFromStorage, setCachedAvatar, type AvatarCacheEntry } from "@/lib/avatar-cache";
import { nameColorStyle } from "@/lib/name-color";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { NAV_LINKS } from "@/config/navigation";
import { getDuckyVisible, setDuckyVisible, getDuckyMuted, setDuckyMuted } from "@/components/DuckyPet";
import { useSyncExternalStore } from "react";
import { NotificationBell } from "@/components/NotificationBell";

function isActive(pathname: string, href: string): boolean {
  if (href.startsWith("/#")) return pathname === "/";
  return pathname.startsWith(href);
}

function subscribeDuckyToggle(callback: () => void) {
  window.addEventListener("ducky-toggle", callback);
  return () => window.removeEventListener("ducky-toggle", callback);
}

type DuckyState = "on" | "muted" | "off";

// Simple duck icon (pixel-style svg). A small speaker glyph sits in the
// bottom-right corner as the sound indicator: plain = sound on, struck
// through (only the speaker, not the duck) = muted. When hidden, the duck
// itself is drawn in a flat gray instead of the accent color, rather than
// crossed out.
function DuckIcon({ state }: { state: DuckyState }) {
  const visible = state !== "off";
  const muted = state === "muted";
  const duckColor = visible ? "currentColor" : "var(--muted-foreground)";
  const beakColor = visible ? "var(--color-accent-gold)" : "var(--muted-foreground)";
  return (
    <svg
      width="18" height="18" viewBox="0 0 20 18" fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ transition: "color 0.3s" }}
    >
      {/* body */}
      <ellipse cx="8" cy="11" rx="5" ry="4" fill={duckColor} opacity="0.9" />
      {/* head */}
      <circle cx="12" cy="7" r="3" fill={duckColor} opacity="0.9" />
      {/* beak */}
      <rect x="14.5" y="6.5" width="2.5" height="1.5" rx="0.5" fill={beakColor} />
      {/* eye */}
      <circle cx="13" cy="6.2" r="0.7" fill="var(--background)" />
      {/* wing hint */}
      <ellipse cx="7" cy="11" rx="2.5" ry="1.5" fill={duckColor} opacity="0.5" />
      {/* speaker вЂ” sound indicator, bottom-right corner. Muted is drawn as
          a plain speaker with no sound wave, rather than struck through. */}
      {visible && (
        <g opacity="0.85">
          <path d="M13 12.2 L14.6 12.2 L17 10.2 L17 17.2 L14.6 15.2 L13 15.2 Z" fill="currentColor" />
          {!muted && (
            <path d="M17.4 11.2 A2.5 2.5 0 0 1 17.4 16.2" stroke="currentColor" strokeWidth="1" strokeLinecap="round" fill="none" />
          )}
        </g>
      )}
    </svg>
  );
}

/**
 * The "РџСЂРѕС„РёР»СЊ" link renders as a self-contained pill (own border/background)
 * rather than a plain text label вЂ” it's not another page to browse to, it's
 * "you", so it needs to read differently from the rest of NAV_LINKS at a
 * glance. Session status starts "loading" briefly on first paint; treated
 * the same as unauthenticated so there's no skeleton, just a quick flip to
 * the real avatar+username once the session resolves.
 */
function AccountLinkContent({ fallbackLabel }: { fallbackLabel: string }) {
  const { data: session, status } = useSession();
  // Lazy initializer reads the in-memory cache synchronously вЂ” this only
  // ever has anything on a client-side remount (navigating in from outside
  // the (main) route group's persistent layout) within the same page load;
  // a hard reload re-evaluates the whole bundle, so this is always a miss
  // right after one. That's on purpose: it must render identically to SSR
  // (also always a miss) or React would flag a hydration mismatch вЂ” the
  // localStorage-backed cache that *does* survive a hard reload is only
  // ever consulted from the effect below, never from render. See
  // src/lib/avatar-cache.ts's module doc comment for why.
  const [avatar, setAvatar] = useState<AvatarCacheEntry>(() => {
    const uid = session?.user?.id;
    return (uid && getCachedAvatar(uid)) || { skinUrl: null, nameColor: null };
  });

  useEffect(() => {
    const uid = session?.user?.id;
    if (status !== "authenticated" || !uid) return;

    // getCachedAvatar first (usually a no-op вЂ” the initializer above
    // already read it, this only helps the rare render where `uid` wasn't
    // known yet at mount), then the localStorage-backed one, which is what
    // actually saves the network round trip after a hard reload.
    const cachedEntry = getCachedAvatar(uid) ?? getCachedAvatarFromStorage(uid);
    if (cachedEntry !== undefined) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAvatar(cachedEntry);
      return;
    }

    let cancelled = false;
    fetch("/api/account/avatar")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const entry: AvatarCacheEntry = { skinUrl: data?.skinUrl ?? null, nameColor: data?.nameColor ?? null };
        setCachedAvatar(uid, entry.skinUrl, entry.nameColor);
        if (!cancelled) setAvatar(entry);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [status, session?.user?.id]);

  const colorStyle = nameColorStyle(avatar.nameColor);

  // Same corner-ornament + square-cornered frame used by every other card
  // in the app (account dashboard, admin lists, ...) вЂ” a rounded-full pill
  // around a square-cornered avatar was two competing border shapes
  // fighting for the same few pixels. The avatar goes borderless since the
  // outer frame is now the one visual border, not two nested ones.
  //
  // hasSiteProfile/linked are false: PlayerAvatar's own Link would nest
  // inside the <Link href="/profile"> this already renders inside (see
  // below), which isn't valid вЂ” this just needs the avatar+name rendering,
  // not a second link. That also gets the standard letter-initial fallback
  // (via PlayerAvatar's <Avatar>/<AvatarFallback>) for a not-yet-linked
  // account, instead of a generic icon.
  //
  // Full nickname always shown (no truncation) вЂ” growName={false} keeps
  // the chip sized to its own content instead of stretching, so a long
  // name just makes the chip wider rather than needing to be cut off.
  if (status === "loading") {
    return <Skeleton className="h-9 w-28 rounded-lg opacity-40" />;
  }

  if (status === "authenticated" && session.user?.name) {
    return (
      <PlayerAvatar
        name={session.user.name}
        skinUrl={avatar.skinUrl}
        hasSiteProfile={false}
        avatarSize={30}
        avatarClassName="rounded-sm border-none"
        growName={false}
        className="corner-ornament relative overflow-hidden gap-2 rounded-lg border border-primary/25 bg-card/70 py-1.5 px-1.5"
        style={colorStyle}
        nameNode={
          <span title={session.user.name} className="text-sm font-medium text-foreground/90 whitespace-nowrap">
            {session.user.name}
          </span>
        }
      />
    );
  }

  return (
    <span className="corner-ornament relative overflow-hidden inline-flex items-center gap-1.5 rounded-lg border border-primary/20 bg-card/70 px-4 py-2 text-sm hover:border-primary/40 transition-colors">
      <UserRound size={18} />
      {fallbackLabel}
    </span>
  );
}

interface NavbarProps {
  /** Whether the current viewer (anonymous-via-Guest-role or logged-in) can open /leaderboard вЂ” hides that nav link instead of showing a dead end that redirects away. Defaults to visible (e.g. not-found.tsx, which renders Navbar without computing this) rather than hiding navigation on an edge-case page. */
  canViewLeaderboard?: boolean;
  /** Same idea for /threads вЂ” that route only requires a session (no resource-role of its own, see getThreadViewer's doc comment), so this is just "is anyone logged in". */
  canViewThreads?: boolean;
  /** Same idea as canViewLeaderboard вЂ” resolved through the guest Role for an anonymous visitor (hasPublicResourceRole("maps-view")), not just session.user.roles. */
  canViewMaps?: boolean;
  /** Same idea as canViewMaps вЂ” hasPublicResourceRole("events-page-view"). */
  canViewEvents?: boolean;
}

export default function Navbar({ canViewLeaderboard = true, canViewThreads = true, canViewMaps = true, canViewEvents = true }: NavbarProps) {
  const t = useTranslations("Nav");
  const pathname = usePathname();
  // Gates the bell вЂ” an anonymous visitor has no notifications, and
  // NotificationsContext only polls for an authenticated session anyway
  // (see its own doc comment), so there's nothing for the bell to show them.
  const { status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const duckyVisible = useSyncExternalStore(subscribeDuckyToggle, getDuckyVisible, () => true);
  const duckyMuted = useSyncExternalStore(subscribeDuckyToggle, getDuckyMuted, () => false);

  const visibleLinks = NAV_LINKS.filter((link) => {
    if (link.key === "leaderboard") return canViewLeaderboard;
    if (link.key === "threads") return canViewThreads;
    if (link.key === "maps") return canViewMaps;
    if (link.key === "events") return canViewEvents;
    return true;
  });

  // Cycle: sound on -> muted (still visible) -> hidden -> sound on ...
  const duckyState: DuckyState = !duckyVisible ? "off" : duckyMuted ? "muted" : "on";

  function toggleDucky() {
    if (duckyState === "on") {
      setDuckyMuted(true);
    } else if (duckyState === "muted") {
      setDuckyVisible(false);
    } else {
      setDuckyVisible(true);
      setDuckyMuted(false);
    }
  }

  const duckyBtnTitle =
    duckyState === "on" ? t("duckMute") : duckyState === "muted" ? t("duckHide") : t("duckShow");

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.includes("#")) {
      const id = href.split("#")[1];
      const el = document.getElementById(id);
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: "smooth" });
        
        if (id === "hero") {
          window.history.pushState(null, "", window.location.pathname);
        } else {
          window.history.pushState(null, "", e.currentTarget.href);
        }
      }
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <nav
        className="backdrop-blur-md border-y border-primary/25"
        style={{ boxShadow: "0 1px 0 rgba(212,160,23,0.04), 0 4px 30px rgba(0,0,0,0.4)" }}
      >
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16 relative">
          <Link 
            href="/#hero" 
            aria-label={t("home")} 
            className="shrink-0"
            onClick={(e) => handleNavClick(e, "/#hero")}
          >
            <Logo />
          </Link>

          {/* Desktop nav links вЂ” absolutely centered against the header
              row (not just the space between logo and the right group),
              so they stay centered regardless of how wide either side is. */}
          <div className="nav-desktop absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center gap-1">
            {visibleLinks.filter((link) => link.key !== "profile").map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className={cn(
                  "relative px-3 py-2 text-sm transition-colors tracking-wide rounded-md",
                  isActive(pathname, link.href)
                    ? "text-primary font-semibold"
                    : "text-foreground/60 hover:text-primary/90"
                )}
                aria-current={isActive(pathname, link.href) ? "page" : undefined}
              >
                {t(link.key)}
                {isActive(pathname, link.href) && (
                  <span className="absolute bottom-0 left-3 right-3 h-px bg-linear-to-r from-transparent via-primary/70 to-transparent" />
                )}
              </Link>
            ))}
          </div>

          {/* Desktop right group: account + utilities вЂ” not part of the
              centered nav, out of normal flow it stays clear of. */}
          <div className="nav-desktop items-center gap-1 shrink-0">
            <Link href="/profile" className="rounded-lg shrink-0">
              <AccountLinkContent fallbackLabel={t("login")} />
            </Link>

            {status === "authenticated" && <NotificationBell />}

            <LanguageSwitcher className="ml-1" />
            <ThemeToggle />

            {/* Duck toggle вЂ” desktop */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDucky}
              title={duckyBtnTitle}
              aria-label={duckyBtnTitle}
              className={cn(
                "transition-colors",
                duckyVisible
                  ? "text-primary/70 hover:text-primary hover:bg-primary/10"
                  : "text-primary/40 hover:text-primary/70 hover:bg-primary/5"
              )}
            >
              <DuckIcon state={duckyState} />
            </Button>
          </div>

          {/* Mobile burger */}
          <div className="nav-burger flex items-center gap-2">
            {status === "authenticated" && <NotificationBell />}
            <LanguageSwitcher />
            <ThemeToggle />

            {/* Duck toggle вЂ” mobile (outside sheet) */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDucky}
              title={duckyBtnTitle}
              aria-label={duckyBtnTitle}
              className={cn(
                "transition-colors",
                duckyVisible
                  ? "text-primary/70 hover:text-primary hover:bg-primary/10"
                  : "text-foreground/40 hover:text-foreground/70 hover:bg-primary/5"
              )}
            >
              <DuckIcon state={duckyState} />
            </Button>

            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-primary/70 hover:text-primary hover:bg-primary/10"
                  aria-label={menuOpen ? t("closeMenu") : t("openMenu")}
                  aria-expanded={menuOpen}
                >
                  <Menu size={22} />
                </Button>
              </SheetTrigger>

              <SheetContent
                side="right"
                className={cn(
                  "w-64 border-l border-border",
                  "bg-background/97 backdrop-blur-lg",
                  "flex flex-col pt-0"
                )}
              >
                <VisuallyHidden>
                  <SheetTitle>{t("menuTitle")}</SheetTitle>
                </VisuallyHidden>

                <div className="flex items-center h-16 px-5 border-b border-border shrink-0">
                  <SheetClose asChild>
                    <Link 
                      href="/#hero"
                      onClick={(e) => handleNavClick(e, "/#hero")}
                    >
                      <Logo />
                    </Link>
                  </SheetClose>
                </div>
                <div className="h-px mx-5 bg-linear-to-r from-transparent via-primary/25 to-transparent" />

                <nav className="flex flex-col px-3 py-4 gap-0.5">
                  {visibleLinks.map((link) => {
                    const isAccount = link.key === "profile";
                    return (
                      <SheetClose asChild key={link.href}>
                        <Link
                          href={link.href}
                          onClick={(e) => handleNavClick(e, link.href)}
                          className={
                            isAccount
                              ? "flex items-center rounded-lg px-2 py-2 mt-1"
                              : cn(
                                  "flex items-center rounded-lg px-4 py-2.5 text-sm tracking-wide transition-colors",
                                  isActive(pathname, link.href)
                                    ? "bg-primary/10 text-primary font-semibold border-l-2 border-primary/50"
                                    : "text-foreground/60 hover:bg-primary/5 hover:text-primary/90"
                                )
                          }
                          aria-current={isActive(pathname, link.href) ? "page" : undefined}
                        >
                          {isAccount ? <AccountLinkContent fallbackLabel={t("login")} /> : t(link.key)}
                        </Link>
                      </SheetClose>
                    );
                  })}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>
    </header>
  );
}


// fix hmr