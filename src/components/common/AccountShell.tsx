import Navbar from "@/components/Navbar";
import { PageBackground } from "./PageBackground";
import { GoldDivider } from "./GoldDivider";
import type { ReactNode } from "react";

interface AccountShellProps {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}

/** Shared centered-card shell for the register/login/link pages. */
export function AccountShell({ title, description, children, footer }: AccountShellProps) {
  return (
    <>
      <Navbar />
      <main className="relative min-h-screen flex items-center justify-center overflow-hidden px-6 pt-24 pb-16">
        <PageBackground />
        

        <div className="relative z-10 w-full max-w-sm mx-auto">
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

            {children}
          </div>

          {footer && <div className="mt-6 text-center text-sm">{footer}</div>}
        </div>
      </main>
    </>
  );
}
