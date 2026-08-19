import { GoldDivider } from "./GoldDivider";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PanelCenteredShellProps {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

/** 
 * A centered card shell for forms inside resizable panels (like new ticket/thread). 
 * Similar to AccountShell, but without fullscreen assumptions (min-h-screen) or PageBackground.
 */
export function PanelCenteredShell({ title, description, children, footer, className }: PanelCenteredShellProps) {
  return (
    <div className={cn("w-full h-full flex flex-col items-center justify-center p-4 overflow-y-auto custom-scrollbar", className)}>
      <div className="w-full max-w-lg my-auto shrink-0">
        <div className="corner-ornament rounded-2xl border border-primary/20 bg-card/60 backdrop-blur-sm p-8 relative overflow-hidden shadow-xl shadow-black/20">
          <div className="absolute top-0 left-8 right-8 h-px bg-linear-to-r from-transparent via-primary/25 to-transparent" />

          <h1
            className="text-2xl text-primary/90 mb-2 text-center leading-tight"
            style={{ fontFamily: "var(--font-body)" }}
          >
            {title}
          </h1>
          {description && (
            <p className="text-foreground/45 text-sm text-center mb-6 leading-relaxed">
              {description}
            </p>
          )}

          <GoldDivider className="mb-6" />

          <div className="relative z-10">
            {children}
          </div>

          {footer && (
            <>
              <GoldDivider className="mt-6 mb-6" />
              <div className="relative z-10 text-center">
                {footer}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
