"use client";

import { ThemeToggle } from "./ThemeToggle";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Link, usePathname } from "@/i18n/navigation";
import { Menu, UserRound } from "lucide-react";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import Logo from "./ui/Logo";
import { Button } from "@/components/ui/button";
import { SkinFace } from "@/components/common/SkinFace";
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
 * The "Кабинет" link's content depends on auth state — everything else in
 * NAV_LINKS is a plain label. Session status starts "loading" briefly on
 * first paint; treated the same as unauthenticated so there's no skeleton,
 * just a quick flip to the real username once the session resolves.
 */
function AccountLinkContent({ fallbackLabel }: { fallbackLabel: string }) {
  const { data: session, status } = useSession();

  if (status === "authenticated" && session.user?.name) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <SkinFace skinUrl={null} size={20} />
        <span className="truncate max-w-24">{session.user.name}</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <UserRound size={16} />
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

        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
          <Link href="/" aria-label={t("home")}>
            <Logo />
          </Link>

          {/* Desktop nav */}
          <div className="nav-desktop items-center gap-1">
            {NAV_LINKS.map((link) => (
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
                {link.key === "account" ? <AccountLinkContent fallbackLabel={t("login")} /> : t(link.key)}
                {isActive(pathname, link.href) && (
                  <span className="absolute bottom-0 left-3 right-3 h-px bg-linear-to-r from-transparent via-primary/70 to-transparent" />
                )}
              </Link>
            ))}

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
                  <Logo />
                </div>
                <div className="h-px mx-5 bg-linear-to-r from-transparent via-primary/25 to-transparent" />

                <nav className="flex flex-col px-3 py-4 gap-0.5">
                  {NAV_LINKS.map((link) => (
                    <SheetClose asChild key={link.href}>
                      <Link
                        href={link.href}
                        onClick={(e) => handleNavClick(e, link.href)}
                        className={cn(
                          "flex items-center rounded-lg px-4 py-2.5 text-sm tracking-wide transition-colors",
                          isActive(pathname, link.href)
                            ? "bg-primary/10 text-primary font-semibold border-l-2 border-primary/50"
                            : "text-foreground/60 hover:bg-primary/5 hover:text-primary/90"
                        )}
                        aria-current={isActive(pathname, link.href) ? "page" : undefined}
                      >
                        {link.key === "account" ? <AccountLinkContent fallbackLabel={t("login")} /> : t(link.key)}
                      </Link>
                    </SheetClose>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>
    </header>
  );
}
