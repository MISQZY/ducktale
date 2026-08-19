"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Resource } from "@/config/resource-roles";

interface AdminNavProps {
  active: Resource;
  /** Which tabs the current viewer can open — from getAdminNavAccess() (src/lib/admin.ts). Tabs the viewer can't reach are hidden rather than shown-and-blocked. */
  navAccess: Record<Resource, boolean>;
}

interface NavItem {
  resource: Resource;
  href: string;
  label: string;
}

/** Same pill visual TabsTrigger used before this became a dropdown-per-section menu — kept so the nav bar reads the same at a glance. */
function groupTriggerClass(active: boolean): string {
  return cn(
    "inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-1.5 text-xs uppercase tracking-widest transition-colors border cursor-pointer",
    "border-primary/15 text-foreground/45 hover:text-foreground/70 hover:border-primary/30",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
    active && "border-primary/40 bg-primary/10 text-primary/90"
  );
}

function itemClass(active: boolean): string {
  return cn(active && "bg-primary/10 text-primary");
}

/**
 * Admin nav, grouped into dropdown menus instead of one flat row of tabs —
 * the flat row grew too wide once enough resources joined. "Права" nests one
 * level deeper as a DropdownMenuSub inside the Users group (permission-model
 * pages are conceptually "users" territory but distinct enough for their own
 * flyout). "Обращения" (Tickets + Reports) was split out of Users into its
 * own top-level group at the user's request — both are player-facing
 * request/response flows, a different kind of thing from user/role
 * management, and warranted their own group once Reports joined Tickets.
 */
export function AdminNav({ active, navAccess }: AdminNavProps) {
  const t = useTranslations("Admin");
  const router = useRouter();

  // Each group's open state is controlled (not a `DropdownMenuItem asChild`
  // wrapping a `Link`) so a click can close the menu and *then* navigate on
  // the next tick, instead of both happening in the same commit. Racing
  // Radix's own close-triggered portal/scroll-lock teardown against the
  // next admin page mounting a brand new DropdownMenu (every admin page
  // renders its own AdminNav — there's no shared/persistent instance across
  // navigation) was intermittently throwing a "Primitive.button failed to
  // slot onto its children" error from a *different* dropdown-adjacent
  // Radix Slot on the incoming page, but only via client-side Link
  // navigation — never on a hard reload of the destination page directly.
  const [usersOpen, setUsersOpen] = useState(false);
  const [appealsOpen, setAppealsOpen] = useState(false);
  const [contentOpen, setContentOpen] = useState(false);

  function goTo(href: string, close: () => void) {
    close();
    setTimeout(() => router.push(href), 0);
  }

  const usersItems: NavItem[] = ([
    { resource: "users", href: "/admin/users", label: t("navUsers") },
    { resource: "whitelist", href: "/admin/whitelist", label: t("navWhitelist") },
    { resource: "badges", href: "/admin/badges", label: t("navBadges") },
    { resource: "ranks", href: "/admin/ranks", label: t("navRanks") },
  ] as NavItem[]).filter((item) => navAccess[item.resource]);

  const permissionsItems: NavItem[] = ([
    { resource: "role", href: "/admin/roles", label: t("navRoles") },
    { resource: "row-level-roles", href: "/admin/row-level-roles", label: t("navRowLevelRoles") },
    { resource: "resource-roles", href: "/admin/resource-roles", label: t("navResourceRoles") },
  ] as NavItem[]).filter((item) => navAccess[item.resource]);

  const appealsItems: NavItem[] = ([
    { resource: "tickets", href: "/admin/tickets", label: t("navTickets") },
    { resource: "reports", href: "/admin/reports", label: t("navReports") },
    { resource: "applications", href: "/admin/applications", label: t("navApplications") },
    { resource: "workflows", href: "/admin/workflows", label: t("navWorkflows") },
  ] as NavItem[]).filter((item) => navAccess[item.resource]);

  const contentItems: NavItem[] = ([
    { resource: "content", href: "/admin/content", label: t("navContent") },
    { resource: "maps", href: "/admin/maps", label: t("navMaps") },
    { resource: "events", href: "/admin/events", label: t("navEvents") },
  ] as NavItem[]).filter((item) => navAccess[item.resource]);

  const permissionsActive = permissionsItems.some((item) => item.resource === active);
  const usersGroupActive = usersItems.some((item) => item.resource === active) || permissionsActive;
  const appealsGroupActive = appealsItems.some((item) => item.resource === active);
  const contentGroupActive = contentItems.some((item) => item.resource === active);

  if (usersItems.length + permissionsItems.length === 0 && appealsItems.length === 0 && contentItems.length === 0) return null;

  return (
    <div className="flex items-center justify-center mb-6">
      <div className="inline-flex items-center gap-1 rounded-full border border-primary/15 bg-card/50 p-1">
        {(usersItems.length > 0 || permissionsItems.length > 0) && (
          <DropdownMenu open={usersOpen} onOpenChange={setUsersOpen}>
            <DropdownMenuTrigger className={groupTriggerClass(usersGroupActive)}>
              {t("navUsers")}
              <ChevronDown className="size-3 opacity-60" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {usersItems.map((item) => (
                <DropdownMenuItem
                  key={item.resource}
                  className={itemClass(item.resource === active)}
                  onSelect={() => goTo(item.href, () => setUsersOpen(false))}
                >
                  {item.label}
                </DropdownMenuItem>
              ))}
              {permissionsItems.length > 0 && (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className={itemClass(permissionsActive)}>
                    {t("navPermissions")}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {permissionsItems.map((item) => (
                      <DropdownMenuItem
                        key={item.resource}
                        className={itemClass(item.resource === active)}
                        onSelect={() => goTo(item.href, () => setUsersOpen(false))}
                      >
                        {item.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {appealsItems.length > 0 && (
          <DropdownMenu open={appealsOpen} onOpenChange={setAppealsOpen}>
            <DropdownMenuTrigger className={groupTriggerClass(appealsGroupActive)}>
              {t("navAppeals")}
              <ChevronDown className="size-3 opacity-60" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {appealsItems.map((item) => (
                <DropdownMenuItem
                  key={item.resource}
                  className={itemClass(item.resource === active)}
                  onSelect={() => goTo(item.href, () => setAppealsOpen(false))}
                >
                  {item.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {contentItems.length > 0 && (
          <DropdownMenu open={contentOpen} onOpenChange={setContentOpen}>
            <DropdownMenuTrigger className={groupTriggerClass(contentGroupActive)}>
              {t("navContent")}
              <ChevronDown className="size-3 opacity-60" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {contentItems.map((item) => (
                <DropdownMenuItem
                  key={item.resource}
                  className={itemClass(item.resource === active)}
                  onSelect={() => goTo(item.href, () => setContentOpen(false))}
                >
                  {item.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
