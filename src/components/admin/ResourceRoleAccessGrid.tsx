"use client";

import { Check, Eye, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { RESOURCE_ROLE_ACTIONS, type Resource, type ResourceRole } from "@/config/resource-roles";
import { localizedName } from "@/lib/i18n-name";
import type { ResourceLabelMap } from "@/lib/resource-role-labels";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export type AccessState = "granted" | "empty" | "na";

/** The single View/Edit mark itself — exported so AdminResourceRolesTable (one column per action, rather than this file's per-resource row layout) renders the exact same visual. */
export function AccessMark({ state }: { state: AccessState }) {
  if (state === "na") return <span className="text-foreground/20 select-none">—</span>;
  return (
    <span
      className={cn(
        "inline-flex size-4 items-center justify-center rounded-[4px] border",
        state === "granted" ? "border-primary bg-primary text-primary-foreground" : "border-input"
      )}
    >
      {state === "granted" && <Check size={11} strokeWidth={3} />}
    </span>
  );
}

interface ResourceRoleAccessGridProps {
  lang: string;
  resources: readonly Resource[];
  resourceLabels: ResourceLabelMap;
  /** Whether `${resource}-${action}` is actually granted — omitted for the catalog reference, where every action that exists in RESOURCE_ROLE_ACTIONS is shown as granted (there's nothing to grant, only to look up). */
  isGranted?: (role: ResourceRole) => boolean;
  /** Presence switches the grid from read-only marks to real, clickable Checkboxes — RoleFormDialog's resource-role picker uses this to edit a Role's grants with the exact same layout the read-only dropdown (RoleGrantsPopover) uses to display them. */
  onToggle?: (role: ResourceRole, checked: boolean) => void;
}

/**
 * "Resource name + View/Edit/Delete access marks" grid — the shared visual
 * for a Role's granted resource-roles (both the read-only AdminRolesTable's
 * grants dropdown, and RoleFormDialog's editable picker, via `onToggle`) and
 * the resource-role catalog reference (AdminResourceRolesTable), see
 * [[PERMISSIONS_BADGES]] §4.1/§4.5. A resource without a given action at all
 * (e.g. "content" has no "view", "resource-roles" has no "delete") renders a
 * dash, not an empty checkbox — that distinction is the point: dash means
 * "doesn't exist" (nothing to check in either mode), empty means "exists,
 * not granted". Column headers are icons (Eye/Pencil/Trash2), not the full
 * "Просмотр"/"Редактирование"/"Удаление" i18n words — those don't fit the
 * narrow checkbox-width columns and were wrapping the header row onto
 * multiple lines; the words are still there as a `title` tooltip.
 * The row list's `overflow-y-auto` is paired with an explicit
 * `overflow-x-hidden` — leaving the x-axis at its CSS default `visible`
 * would have it computed as `auto` too (the "one non-visible overflow axis
 * forces the other to auto" rule), which can render a horizontal scrollbar
 * off a sub-pixel rounding mismatch alone; the callers (RoleGrantsPopover,
 * RoleFormDialog) additionally size their Popover to the grid's own content
 * width (`w-max`, capped by `max-w-sm`) instead of a fixed width narrower
 * than the widest resource label, so truncation on the name column is a
 * safety net, not the normal case.
 */
export function ResourceRoleAccessGrid({ lang, resources, resourceLabels, isGranted, onToggle }: ResourceRoleAccessGridProps) {
  const tr = useTranslations("Admin.resourceRoles");
  const tal = useTranslations("Admin.resourceRoles.actionLabels");

  return (
    <div className="flex flex-col text-xs">
      <div className="flex items-center gap-3 pb-1.5 mb-1 border-b border-primary/10 text-foreground/40 uppercase tracking-wide text-[10px]">
        <span className="flex-1">{tr("resourceColumn")}</span>
        <span className="w-6 flex justify-center" title={tal("view")}>
          <Eye size={13} />
        </span>
        <span className="w-6 flex justify-center" title={tal("edit")}>
          <Pencil size={12} />
        </span>
        <span className="w-6 flex justify-center" title={tal("delete")}>
          <Trash2 size={12} />
        </span>
      </div>
      <div className="flex flex-col max-h-64 overflow-y-auto overflow-x-hidden">
        {resources.length === 0 && (
          <p className="text-xs text-foreground/35 py-2 text-center">
            {lang === "ru" ? "Не найдено" : "No results"}
          </p>
        )}
        {resources.map((resource) => {
          const actions = RESOURCE_ROLE_ACTIONS[resource] as readonly string[];
          return (
            <div
              key={resource}
              className={cn("flex items-center gap-3 py-1", onToggle && "rounded px-1 -mx-1 hover:bg-primary/5 transition-colors")}
            >
              <span className="flex-1 min-w-0 truncate text-foreground/80">{localizedName(resourceLabels[resource], lang)}</span>
              {(["view", "edit", "delete"] as const).map((action) => {
                const exists = actions.includes(action);
                const role = `${resource}-${action}` as ResourceRole;
                if (!exists) {
                  return (
                    <span key={action} className="w-6 flex justify-center shrink-0">
                      <AccessMark state="na" />
                    </span>
                  );
                }
                const granted = !isGranted || isGranted(role);
                if (!onToggle) {
                  return (
                    <span key={action} className="w-6 flex justify-center shrink-0">
                      <AccessMark state={granted ? "granted" : "empty"} />
                    </span>
                  );
                }
                return (
                  <span key={action} className="w-6 flex justify-center shrink-0">
                    <Checkbox
                      checked={granted}
                      onCheckedChange={(checked) => onToggle(role, !!checked)}
                      className="size-4"
                    />
                  </span>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
