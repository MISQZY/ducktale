"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import Logo from "./ui/Logo";
import { SERVERS } from "@/config/servers";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";

const navLinks = [
  { href: "/#about", label: "О проекте" },
  { href: "/#servers", label: "Серверы" },
  ...SERVERS.map((s) => ({ href: s.href, label: s.name })),
];

export default function Navbar() {
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
                className="text-sm text-amber-100/70 hover:text-amber-300 transition-colors tracking-wide"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Mobile: shadcn Sheet */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-amber-400 hover:text-amber-300 hover:bg-amber-400/10"
                aria-label="Открыть меню"
              >
                <Menu size={22} />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="bg-duck-darker/95 border-amber-900/30 backdrop-blur-md w-64"
            >
              <div className="flex flex-col gap-4 mt-8">
                {navLinks.map((link) => (
                  <SheetClose asChild key={link.href}>
                    <Link
                      href={link.href}
                      className="text-amber-100/70 hover:text-amber-300 transition-colors py-1"
                    >
                      {link.label}
                    </Link>
                  </SheetClose>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}