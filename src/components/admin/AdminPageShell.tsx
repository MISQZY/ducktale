import type { ReactNode } from "react";
import { GoldDivider } from "@/components/common/GoldDivider";
import { AdminNav } from "@/components/admin/AdminNav";
import type { Resource } from "@/config/resource-roles";

interface AdminPageShellProps {
  title: string;
  description: string;
  active: Resource;
  navAccess: Record<Resource, boolean>;
  children: ReactNode;
  fullHeight?: boolean;
}

/**
 * Shared frame for every admin page — same max-width and spacing on both
 * /admin and /admin/content, so switching between them doesn't visibly
 * shift the page. Only the content between AdminNav and the closing tag
 * differs per page.
 */
export function AdminPageShell({ title, description, active, navAccess, children, fullHeight }: AdminPageShellProps) {
  return (
    <main className={`relative overflow-hidden px-6 pt-24 pb-8 ${fullHeight ? "h-dvh flex flex-col" : "min-h-screen pb-16"}`}>
      <div className={`relative z-10 mx-auto w-full ${fullHeight ? "flex-1 flex flex-col min-h-0 max-w-[1600px]" : "max-w-[1600px]"}`}>
        <h1
          className="text-3xl text-primary/90 mb-2 leading-tight text-center"
          style={{ fontFamily: "var(--font-body)" }}
        >
          {title}
        </h1>
        <p className="text-foreground/60 mb-6 text-center">{description}</p>

        <AdminNav active={active} navAccess={navAccess} />

        <GoldDivider className="mb-8" />

        {children}
      </div>
    </main>
  );
}
