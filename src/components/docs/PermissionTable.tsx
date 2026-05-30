import { Fragment } from "react";
import { cn } from "@/lib/utils";
import { Check, X, Minus, Lock } from "lucide-react";
import type { GlobalPermission } from "@/config/permissions/types";
import {
  DocsTable,
  DocsTableHeader,
  DocsTableBody,
  DocsTableRow,
  DocsTableHead,
  DocsTableCell,
  DOCS_TABLE_THEME,
} from "@/components/ui/docs-table";

// ─── Types ────────────────────────────────────────────────────────────────────

export type { GlobalPermission };
export type Role = GlobalPermission;

/** Per-cell access value */
export type AccessValue =
  | true
  | false
  | string;

export interface PermissionRow {
  label: string;
  description?: string;
  access: Partial<Record<Role, AccessValue>>;
}

export interface PermissionGroup {
  title: string;
  rows: PermissionRow[];
}

export interface PermissionTableProps {
  roles?: Role[];
  groups: PermissionGroup[];
  className?: string;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const ROLE_META: Record<Role, { shortLabel: string; headerCn: string; dotCn: string }> = {
  all: {
    shortLabel: "Игрок",
    headerCn: "text-stone-300",
    dotCn: "bg-stone-400",
  },
  old: {
    shortLabel: "Олд",
    headerCn: "text-amber-300",
    dotCn: "bg-amber-400",
  },
  supporter: {
    shortLabel: "Донат",
    headerCn: "text-yellow-300",
    dotCn: "bg-yellow-400",
  },
  admin: {
    shortLabel: "Админ",
    headerCn: "text-sky-300",
    dotCn: "bg-sky-400",
  },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function AccessCell({ value }: { value: AccessValue }) {
  if (value === true) {
    return (
      <span className="inline-flex items-center justify-center">
        <Check size={13} strokeWidth={2.5} className="text-emerald-400" aria-label="Доступно" />
      </span>
    );
  }

  if (value === false) {
    return (
      <span className="inline-flex items-center justify-center">
        <X size={12} strokeWidth={2.5} className="text-stone-600" aria-label="Недоступно" />
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-300/80 whitespace-nowrap" aria-label={value}>
      <Minus size={9} className="text-amber-500/60 shrink-0" />
      {value}
    </span>
  );
}

function GroupHeader({ title, colSpan }: { title: string; colSpan: number }) {
  return (
    <DocsTableRow className="border-b-0">
      <DocsTableCell colSpan={colSpan} className="pt-5 pb-1.5 px-4">
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] uppercase tracking-widest font-semibold text-amber-500/70"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {title}
          </span>
          <div className="flex-1 h-px bg-amber-900/25" />
        </div>
      </DocsTableCell>
    </DocsTableRow>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const DEFAULT_ROLES: Role[] = ["all", "old", "supporter", "admin"];

export function PermissionTable({
  roles = DEFAULT_ROLES,
  groups,
  className,
}: PermissionTableProps) {
  const totalCols = roles.length + 1;

  return (
    <DocsTable wrapperClassName={className}>
      <DocsTableHeader>
        <DocsTableRow>
          <DocsTableHead withRightBorder className="w-full">
            <span className="inline-flex items-center gap-1.5">
              <Lock size={10} className="text-amber-700/70" />
              Возможность
            </span>
          </DocsTableHead>

          {roles.map((role, i) => {
            const meta = ROLE_META[role];
            return (
              <DocsTableHead
                key={role}
                withRightBorder={i < roles.length - 1}
                className="text-center min-w-16"
              >
                <span className={cn("inline-flex flex-col items-center gap-0.5", meta.headerCn)}>
                  <span className={cn("w-1.5 h-1.5 rounded-full", meta.dotCn)} aria-hidden="true" />
                  {meta.shortLabel}
                </span>
              </DocsTableHead>
            );
          })}
        </DocsTableRow>
      </DocsTableHeader>

      <DocsTableBody className="[&_tr:last-child]:border-0">
        {groups.map((group) => (
          <Fragment key={group.title}>
            <GroupHeader title={group.title} colSpan={totalCols} />

            {group.rows.map((row) => (
              <DocsTableRow key={row.label}>
                <DocsTableCell withRightBorder className="py-2.5">
                  <span className="text-sm text-amber-100/80 leading-snug">
                    {row.label}
                  </span>
                  {row.description && (
                    <span className={cn("block text-[11px] leading-snug mt-0.5", DOCS_TABLE_THEME.textFaint)}>
                      {row.description}
                    </span>
                  )}
                </DocsTableCell>

                {roles.map((role, i) => (
                  <DocsTableCell
                    key={role}
                    withRightBorder={i < roles.length - 1}
                    className="text-center py-2.5 px-2"
                  >
                    <AccessCell value={row.access[role] ?? false} />
                  </DocsTableCell>
                ))}
              </DocsTableRow>
            ))}
          </Fragment>
        ))}
      </DocsTableBody>
    </DocsTable>
  );
}