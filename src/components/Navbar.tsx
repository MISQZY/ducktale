"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { useState } from "react";
import Logo from "./ui/Logo";
import { SERVERS } from "@/config/servers";
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

const navLinks = [
  { href: "/#about",   label: "О проекте" },
  { href: "/#servers", label: "Серверы" },
  { href: "/#infrastructure",   label: "Инфраструктура" },
  { href: "/#community", label: "Сообщество" },
  ...SERVERS.map((s) => ({ href: s.href, label: s.name })),
];

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  function isActive(href: string) {
    if (href.startsWith("/#")) return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50">

      <nav className="backdrop-blur-md border-b border-gold-800/25"
           style={{ boxShadow: "0 1px 0 rgba(212,160,23,0.04), 0 4px 30px rgba(0,0,0,0.4)" }}>
            
        <div className="h-px bg-linear-to-r from-transparent via-gold-500/70 to-transparent" />
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
          <Link href="/" aria-label="DuckTale — на главную">
            <Logo />
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative px-4 py-2 text-sm transition-colors tracking-wide rounded-md",
                  isActive(link.href)
                    ? "text-gold-300 font-semibold"
                    : "text-amber-100/55 hover:text-gold-300/90"
                )}
                aria-current={isActive(link.href) ? "page" : undefined}
              >
                {link.label}
                {isActive(link.href) && (
                  <span className="absolute bottom-0 left-3 right-3 h-px bg-linear-to-r from-transparent via-gold-400/70 to-transparent" />
                )}
              </Link>
            ))}
          </div>

          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-gold-400/70 hover:text-gold-300 hover:bg-gold-400/8"
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
                {navLinks.map((link) => (
                  <SheetClose asChild key={link.href}>
                    <Link
                      href={link.href}
                      className={cn(
                        "flex items-center rounded-lg px-4 py-2.5 text-sm tracking-wide transition-colors",
                        isActive(link.href)
                          ? "bg-gold-400/8 text-gold-300 font-semibold border-l-2 border-gold-400/50"
                          : "text-amber-100/50 hover:bg-gold-400/5 hover:text-gold-200/80"
                      )}
                      aria-current={isActive(link.href) ? "page" : undefined}
                    >
                      {link.label}
                    </Link>
                  </SheetClose>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
