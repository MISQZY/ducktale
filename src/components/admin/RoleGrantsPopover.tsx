"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ResourceRoleAccessGrid } from "@/components/admin/ResourceRoleAccessGrid";
import { RESOURCE_ROLE_ACTIONS, type Resource, type ResourceRole } from "@/config/resource-roles";
import type { ResourceLabelMap } from "@/lib/resource-role-labels";
import { cn } from "@/lib/utils";

const ALL_RESOURCES = Object.keys(RESOURCE_ROLE_ACTIONS) as Resource[];

interface RoleGrantsPopoverProps {
  lang: string;
  resourceRoles: ResourceRole[];
  resourceLabels: ResourceLabelMap;
}

/** Collapsed-by-default grants summary for one Role row — click to open the full resource access grid (ResourceRoleAccessGrid), instead of the whole grid always taking up row height. Included Roles live in their own table column (AdminRolesTable), not in here — this is resource-roles only. */
export function RoleGrantsPopover({ lang, resourceRoles, resourceLabels }: RoleGrantsPopoverProps) {
  const tr = useTranslations("Admin.roles");
  const [open, setOpen] = useState(false);

  if (resourceRoles.length === 0) return <span className="text-foreground/30">—</span>;

  const granted = new Set(resourceRoles);

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-xs text-foreground/70 hover:text-primary transition-colors cursor-pointer"
        >
          <span>{tr("resourceRolesLabel")}</span>
          <span className="inline-flex items-center justify-center min-w-4.5 h-4.5 px-1 rounded-full bg-primary/15 text-primary text-[10px] font-medium">
            {resourceRoles.length}
          </span>
          <ChevronDown size={13} className={cn("transition-transform", open && "rotate-180")} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-max max-w-sm p-3 rounded-xl liquid-card border-primary/20" align="start">
        <ResourceRoleAccessGrid
          lang={lang}
          resources={ALL_RESOURCES}
          resourceLabels={resourceLabels}
          isGranted={(role) => granted.has(role)}
        />
      </PopoverContent>
    </Popover>
  );
}
