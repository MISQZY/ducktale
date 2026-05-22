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
  { href: "/#about", label: "О проекте" },
  { href: "/#servers", label: "Серверы" },
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
      {/* Top golden line */}
      <div className="h-px bg-linear-to-r from-transparent via-amber-500 to-transparent" />

      <nav className="backdrop-blur-md bg-duck-darker/80 border-b border-amber-900/30">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/">
            <Logo />
          </Link>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm transition-colors tracking-wide",
                  isActive(link.href)
                    ? "text-amber-300 font-semibold"
                    : "text-amber-100/70 hover:text-amber-300"
                )}
                aria-current={isActive(link.href) ? "page" : undefined}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Mobile: shadcn Sheet */}
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-amber-400 hover:text-amber-300 hover:bg-amber-400/10"
                aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
                aria-expanded={menuOpen}
              >
                <Menu size={22} />
              </Button>
            </SheetTrigger>

            <SheetContent
              side="right"
              className={cn(
                "w-64 border-l border-amber-900/30",
                "bg-[#0e0c09]/95 backdrop-blur-md",
                "flex flex-col pt-0"
              )}
            >
              {/* Accessible title */}
              <VisuallyHidden>
                <SheetTitle>Навигация</SheetTitle>
              </VisuallyHidden>

              {/* Header strip matching the navbar */}
              <div className="flex items-center h-16 px-5 border-b border-amber-900/30 shrink-0">
                <Logo />
              </div>

              {/* Nav links */}
              <nav className="flex flex-col px-4 py-5 gap-1">
                {navLinks.map((link) => (
                  <SheetClose asChild key={link.href}>
                    <Link
                      href={link.href}
                      className={cn(
                        "flex items-center rounded-lg px-3 py-2.5 text-sm tracking-wide transition-colors",
                        isActive(link.href)
                          ? "bg-amber-400/10 text-amber-300 font-semibold"
                          : "text-amber-100/60 hover:bg-amber-400/6 hover:text-amber-200"
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