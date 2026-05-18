"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import Logo from "./ui/Logo"

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Top golden line */}
      <div className="h-px bg-linear-to-r from-transparent via-amber-500 to-transparent" />

      <nav className="backdrop-blur-md bg-duck-darker/80 border-b border-amber-900/30">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={"/"}>
            <Logo/>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            <NavLink href="/#about">О проекте</NavLink>
            <NavLink href="/#servers">Серверы</NavLink>
            <NavLink href="/docs/duckburg">DuckBurg</NavLink>
            <NavLink href="/docs/duckhood">DuckHood</NavLink>
          </div>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/#connect"
              className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-duck-dark font-semibold text-sm transition-all hover:shadow-lg hover:shadow-amber-500/25 active:scale-95"
            >
              Подключиться
            </Link>
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden text-amber-400 hover:text-amber-300"
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-duck-darker/95 backdrop-blur-md border-b border-amber-900/30 px-6 py-4 flex flex-col gap-4">
          <MobileNavLink href="/#about" onClick={() => setOpen(false)}>
            О проекте
          </MobileNavLink>
          <MobileNavLink href="/#servers" onClick={() => setOpen(false)}>
            Серверы
          </MobileNavLink>
          <MobileNavLink href="/docs/duckburg" onClick={() => setOpen(false)}>
            DuckBurg Docs
          </MobileNavLink>
          <MobileNavLink href="/docs/duckhood" onClick={() => setOpen(false)}>
            DuckHood Docs
          </MobileNavLink>
        </div>
      )}
    </header>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="text-sm text-amber-100/70 hover:text-amber-300 transition-colors tracking-wide"
    >
      {children}
    </Link>
  );
}

function MobileNavLink({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="text-amber-100/70 hover:text-amber-300 transition-colors py-1"
    >
      {children}
    </Link>
  );
}
