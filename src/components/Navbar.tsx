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
import { PlayerAvatar } from "@/components/common/PlayerAvatar";
import { getCachedAvatar, setCachedAvatar } from "@/lib/avatar-cache";
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
import { getDuckyVisible, setDuckyVisible } from "@/components/DuckyPet";
import { useSyncExternalStore } from "react";

function isActive(pathname: string, href: string): boolean {
  if (href.startsWith("/#")) return pathname === "/";
  return pathname.startsWith(href);
}

function subscribeDuckyToggle(callback: () => void) {
  window.addEventListener("ducky-toggle", callback);
  return () => window.removeEventListener("ducky-toggle", callback);
}

// Simple duck icon (pixel-style svg)
function DuckIcon({ visible }: { visible: boolean }) {
  return (
    <svg
      width="18" height="18" viewBox="0 0 18 18" fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ opacity: visible ? 1 : 0.45, transition: "opacity 0.3s" }}
    >
      {/* body */}
      <ellipse cx="8" cy="11" rx="5" ry="4" fill="currentColor" opacity="0.9" />
      {/* head */}
      <circle cx="12" cy="7" r="3" fill="currentColor" opacity="0.9" />
      {/* beak */}
      <rect x="14.5" y="6.5" width="2.5" height="1.5" rx="0.5" fill="var(--color-accent-gold)" />
      {/* eye */}
      <circle cx="13" cy="6.2" r="0.7" fill="var(--background)" />
      {/* wing hint */}
      <ellipse cx="7" cy="11" rx="2.5" ry="1.5" fill="currentColor" opacity="0.5" />
      {/* crossed out line when hidden */}
      {!visible && (
        <line x1="2" y1="2" x2="16" y2="16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
      )}
    </svg>
  );
}

/**
 * The "Профиль" link renders as a self-contained pill (own border/background)
 * rather than a plain text label — it's not another page to browse to, it's
 * "you", so it needs to read differently from the rest of NAV_LINKS at a
 * glance. Session status starts "loading" briefly on first paint; treated
 * the same as unauthenticated so there's no skeleton, just a quick flip to
 * the real avatar+username once the session resolves.
 */
function AccountLinkContent({ fallbackLabel }: { fallbackLabel: string }) {
  const { data: session, status } = useSession();
  // Lazy initializer reads the module-level cache synchronously, so a
  // navigation that remounts this (Navbar isn't part of the persistent
  // [lang] layout — every page renders its own <Navbar/>) paints the real
  // head immediately instead of flashing back to the fallback icon while a
  // fresh fetch resolves. See src/lib/avatar-cache.ts.
  const [skinUrl, setSkinUrl] = useState<string | null>(() => {
    const uid = session?.user?.id;
    return uid ? getCachedAvatar(uid) ?? null : null;
  });

  useEffect(() => {
    const uid = session?.user?.id;
    if (status !== "authenticated" || !uid) return;

    const cachedUrl = getCachedAvatar(uid);
    if (cachedUrl !== undefined) {
      // Usually a no-op (the useState initializer above already read the
      // same cache synchronously) — this only does anything on the rare
      // render where `uid` wasn't known yet at mount and only became
      // available once the session resolved, restoring state from that
      // external cache the same way docs/PlayerCard.tsx and
      // RankingsTabs.tsx already do for their own mount-time restores.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSkinUrl(cachedUrl);
      return;
    }

    let cancelled = false;
    fetch("/api/account/avatar")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const url = data?.skinUrl ?? null;
        setCachedAvatar(uid, url);
        if (!cancelled) setSkinUrl(url);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [status, session?.user?.id]);

  // Same corner-ornament + square-cornered frame used by every other card
  // in the app (account dashboard, admin lists, ...) — a rounded-full pill
  // around a square-cornered avatar was two competing border shapes
  // fighting for the same few pixels. The avatar goes borderless since the
  // outer frame is now the one visual border, not two nested ones.
  //
  // hasSiteProfile/linked are false: PlayerAvatar's own Link would nest
  // inside the <Link href="/profile"> this already renders inside (see
  // below), which isn't valid — this just needs the avatar+name rendering,
  // not a second link. That also gets the standard letter-initial fallback
  // (via PlayerAvatar's <Avatar>/<AvatarFallback>) for a not-yet-linked
  // account, instead of a generic icon.
  //
  // Nicknames run up to 32 chars (schema.prisma.template) — letting this
  // grow to fit that squeezed the rest of the nav bar and looked broken, so
  // it's capped and ellipsized instead, with the full name always available
  // via the native title tooltip.
  if (status === "authenticated" && session.user?.name) {
    return (
      <PlayerAvatar
        name={session.user.name}
        skinUrl={skinUrl}
        hasSiteProfile={false}
        avatarSize={30}
        avatarClassName="rounded-sm border-none"
        className="corner-ornament relative overflow-hidden gap-2 rounded-lg border border-primary/25 bg-card/70 py-1.5 pr-4 pl-1.5"
        nameNode={
          <span title={session.user.name} className="text-sm font-medium text-foreground/90 truncate max-w-32">
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

export default function Navbar() {
  const t = useTranslations("Nav");
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const duckyVisible = useSyncExternalStore(subscribeDuckyToggle, getDuckyVisible, () => true);

  function toggleDucky() {
    setDuckyVisible(!duckyVisible);
  }

  const duckyBtnTitle = duckyVisible ? t("duckHide") : t("duckShow");

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
        className="backdrop-blur-md border-b border-primary/25"
        style={{ boxShadow: "0 1px 0 rgba(212,160,23,0.04), 0 4px 30px rgba(0,0,0,0.4)" }}
      >
        <div className="h-px bg-linear-to-r from-transparent via-gold-500/70 to-transparent" />

        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16 relative">
          <Link 
            href="/#hero" 
            aria-label={t("home")} 
            className="shrink-0"
            onClick={(e) => handleNavClick(e, "/#hero")}
          >
            <Logo />
          </Link>

          {/* Desktop nav links — absolutely centered against the header
              row (not just the space between logo and the right group),
              so they stay centered regardless of how wide either side is. */}
          <div className="nav-desktop absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center gap-1">
            {NAV_LINKS.filter((link) => link.key !== "profile").map((link) => (
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

          {/* Desktop right group: account + utilities — not part of the
              centered nav, out of normal flow it stays clear of. */}
          <div className="nav-desktop items-center gap-1 shrink-0">
            <Link href="/profile" className="rounded-lg shrink-0">
              <AccountLinkContent fallbackLabel={t("login")} />
            </Link>

            <LanguageSwitcher className="ml-1" />
            <ThemeToggle />

            {/* Duck toggle — desktop */}
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
              <DuckIcon visible={duckyVisible} />
            </Button>
          </div>

          {/* Mobile burger */}
          <div className="nav-burger flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />

            {/* Duck toggle — mobile (outside sheet) */}
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
              <DuckIcon visible={duckyVisible} />
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
                  {NAV_LINKS.map((link) => {
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
