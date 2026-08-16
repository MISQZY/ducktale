"use client";

import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import { Link } from "@/i18n/navigation";
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
 * Admin nav, grouped into two dropdown menus ("Пользователи"/"Контент")
 * instead of one flat row of tabs — the flat row grew to 8 entries once
 * Роли/Роли-уровня-строк/Ресурсные-роли (see [[PERMISSIONS_BADGES]] §4.1/
 * §4.1а) joined Тикеты/Бейджи/Ранги under Users. "Права" nests one level
 * deeper as a DropdownMenuSub inside the Users group, at the user's request
 * — those three permission-model pages are conceptually "users" territory
 * but distinct enough to warrant their own flyout rather than sitting flat
 * alongside Тикеты/Бейджи/Ранги.
 */
export function AdminNav({ active, navAccess }: AdminNavProps) {
  const t = useTranslations("Admin");

  const usersItems: NavItem[] = ([
    { resource: "users", href: "/admin/users", label: t("navUsers") },
    { resource: "tickets", href: "/admin/tickets", label: t("navTickets") },
    { resource: "badges", href: "/admin/badges", label: t("navBadges") },
    { resource: "ranks", href: "/admin/ranks", label: t("navRanks") },
  ] as NavItem[]).filter((item) => navAccess[item.resource]);

  const permissionsItems: NavItem[] = ([
    { resource: "role", href: "/admin/roles", label: t("navRoles") },
    { resource: "row-level-roles", href: "/admin/row-level-roles", label: t("navRowLevelRoles") },
    { resource: "resource-roles", href: "/admin/resource-roles", label: t("navResourceRoles") },
  ] as NavItem[]).filter((item) => navAccess[item.resource]);

  const contentItems: NavItem[] = ([
    { resource: "content", href: "/admin/content", label: t("navContent") },
  ] as NavItem[]).filter((item) => navAccess[item.resource]);

  const permissionsActive = permissionsItems.some((item) => item.resource === active);
  const usersGroupActive = usersItems.some((item) => item.resource === active) || permissionsActive;
  const contentGroupActive = contentItems.some((item) => item.resource === active);

  if (usersItems.length + permissionsItems.length === 0 && contentItems.length === 0) return null;

  return (
    <div className="flex items-center justify-center mb-6">
      <div className="inline-flex items-center gap-1 rounded-full border border-primary/15 bg-card/50 p-1">
        {(usersItems.length > 0 || permissionsItems.length > 0) && (
          <DropdownMenu>
            <DropdownMenuTrigger className={groupTriggerClass(usersGroupActive)}>
              {t("navUsers")}
              <ChevronDown className="size-3 opacity-60" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {usersItems.map((item) => (
                <DropdownMenuItem key={item.resource} asChild className={itemClass(item.resource === active)}>
                  <Link href={item.href}>{item.label}</Link>
                </DropdownMenuItem>
              ))}
              {permissionsItems.length > 0 && (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className={itemClass(permissionsActive)}>
                    {t("navPermissions")}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {permissionsItems.map((item) => (
                      <DropdownMenuItem key={item.resource} asChild className={itemClass(item.resource === active)}>
                        <Link href={item.href}>{item.label}</Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {contentItems.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger className={groupTriggerClass(contentGroupActive)}>
              {t("navContent")}
              <ChevronDown className="size-3 opacity-60" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {contentItems.map((item) => (
                <DropdownMenuItem key={item.resource} asChild className={itemClass(item.resource === active)}>
                  <Link href={item.href}>{item.label}</Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
