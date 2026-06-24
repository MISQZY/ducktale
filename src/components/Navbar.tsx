"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { useState, useEffect } from "react";
import Logo from "./ui/Logo";
import { Button } from "@/components/ui/button";
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

function isActive(pathname: string, href: string): boolean {
  if (href.startsWith("/#")) return pathname === "/";
  return pathname.startsWith(href);
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
      <rect x="14.5" y="6.5" width="2.5" height="1.5" rx="0.5" fill="#d4a017" />
      {/* eye */}
      <circle cx="13" cy="6.2" r="0.7" fill="#1a160a" />
      {/* wing hint */}
      <ellipse cx="7" cy="11" rx="2.5" ry="1.5" fill="currentColor" opacity="0.5" />
      {/* crossed out line when hidden */}
      {!visible && (
        <line x1="2" y1="2" x2="16" y2="16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
      )}
    </svg>
  );
}

export default function Navbar() {
  const pathname  = usePathname();
  const [menuOpen,      setMenuOpen]      = useState(false);
  const [duckyVisible,  setDuckyVisibleS] = useState(true);

  // Sync with localStorage on mount + listen to external toggle events
  useEffect(() => {
    setDuckyVisibleS(getDuckyVisible());
    const handler = (e: Event) => setDuckyVisibleS((e as CustomEvent<boolean>).detail);
    window.addEventListener("ducky-toggle", handler);
    return () => window.removeEventListener("ducky-toggle", handler);
  }, []);

  function toggleDucky() {
    const next = !duckyVisible;
    setDuckyVisibleS(next);
    setDuckyVisible(next);
  }

  const duckyBtnTitle = duckyVisible ? "Скрыть уточку" : "Показать уточку";

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <nav
        className="backdrop-blur-md border-b border-gold-800/25"
        style={{ boxShadow: "0 1px 0 rgba(212,160,23,0.04), 0 4px 30px rgba(0,0,0,0.4)" }}
      >
        <div className="h-px bg-linear-to-r from-transparent via-gold-500/70 to-transparent" />

        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
          <Link href="/" aria-label="DuckTale — на главную">
            <Logo />
          </Link>

          {/* Desktop nav */}
          <div className="nav-desktop items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative px-3 py-2 text-sm transition-colors tracking-wide rounded-md",
                  isActive(pathname, link.href)
                    ? "text-gold-300 font-semibold"
                    : "text-amber-100/55 hover:text-gold-300/90"
                )}
                aria-current={isActive(pathname, link.href) ? "page" : undefined}
              >
                {link.label}
                {isActive(pathname, link.href) && (
                  <span className="absolute bottom-0 left-3 right-3 h-px bg-linear-to-r from-transparent via-gold-400/70 to-transparent" />
                )}
              </Link>
            ))}

            {/* Duck toggle — desktop */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDucky}
              title={duckyBtnTitle}
              aria-label={duckyBtnTitle}
              className={cn(
                "ml-1 transition-colors",
                duckyVisible
                  ? "text-gold-400/70 hover:text-gold-300 hover:bg-gold-400/8"
                  : "text-amber-100/30 hover:text-amber-100/60 hover:bg-gold-400/5"
              )}
            >
              <DuckIcon visible={duckyVisible} />
            </Button>
          </div>

          {/* Mobile burger */}
          <div className="nav-burger flex items-center gap-2">
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
                  ? "text-gold-400/70 hover:text-gold-300 hover:bg-gold-400/8"
                  : "text-amber-100/30 hover:text-amber-100/60 hover:bg-gold-400/5"
              )}
            >
              <DuckIcon visible={duckyVisible} />
            </Button>

            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gold-400/70 hover:text-gold-300 hover:bg-gold-400/8"
                  aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
                  aria-expanded={menuOpen}
                >
                  <Menu size={22} />
                </Button>
              </SheetTrigger>

              <SheetContent
                side="right"
                className={cn(
                  "w-64 border-l border-gold-800/25",
                  "bg-stone-950/97 backdrop-blur-lg",
                  "flex flex-col pt-0"
                )}
              >
                <VisuallyHidden>
                  <SheetTitle>Навигация</SheetTitle>
                </VisuallyHidden>

                <div className="flex items-center h-16 px-5 border-b border-gold-800/20 shrink-0">
                  <Logo />
                </div>
                <div className="h-px mx-5 bg-linear-to-r from-transparent via-gold-600/25 to-transparent" />

                <nav className="flex flex-col px-3 py-4 gap-0.5">
                  {NAV_LINKS.map((link) => (
                    <SheetClose asChild key={link.href}>
                      <Link
                        href={link.href}
                        className={cn(
                          "flex items-center rounded-lg px-4 py-2.5 text-sm tracking-wide transition-colors",
                          isActive(pathname, link.href)
                            ? "bg-gold-400/8 text-gold-300 font-semibold border-l-2 border-gold-400/50"
                            : "text-amber-100/50 hover:bg-gold-400/5 hover:text-gold-200/80"
                        )}
                        aria-current={isActive(pathname, link.href) ? "page" : undefined}
                      >
                        {link.label}
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
