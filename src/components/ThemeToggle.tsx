"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// No mounted-gate/placeholder needed here despite resolvedTheme being
// client-only: the icon choice itself is pure CSS (the dark: variants
// below), driven by the `dark` class next-themes sets on <html> before
// hydration — not by resolvedTheme, which this component only reads inside
// the click handler, where being client-only is fine. Gating the whole
// button behind a mount effect (the previous version of this component)
// just blanked the icon for a beat on every page load for no benefit.
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(resolvedTheme === "light" ? "dark" : "light")}
      className={cn("text-primary/70 hover:text-primary hover:bg-primary/5 transition-colors", className)}
      aria-label="Переключить тему"
      title="Переключить тему"
    >
      <Sun className="h-[1.1rem] w-[1.1rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.1rem] w-[1.1rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
}
