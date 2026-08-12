"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Check, Copy, Lock, ChevronDown } from "lucide-react";
import { getPermission } from "@/config/permissions";
import type { GlobalPermission } from "@/config/permissions/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export type { GlobalPermission };

export interface CommandArg {
  name: string;
  description: string;
}

export interface CommandCardProps {
  command: string;
  description: string;
  required?: CommandArg[];
  optional?: CommandArg[];
  permission?: GlobalPermission;
  roles?: string[];
  /** @deprecated */
  usage?: string;
  /** @deprecated */
  aliases?: string[];
  className?: string;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const GLOBAL_PERMS: Record<
  GlobalPermission,
  { text: string; bg: string; border: string }
> = {
  all: {
    text: "text-emerald-700 dark:text-emerald-300",
    bg: "bg-emerald-100 dark:bg-emerald-950/60",
    border: "border-emerald-300/60 dark:border-emerald-700/40",
  },
  old: {
    text: "text-amber-800 dark:text-foreground",
    bg: "bg-amber-100 dark:bg-primary/60",
    border: "border-amber-300/60 dark:border-amber-700/40",
  },
  supporter: {
    text: "text-amber-800 dark:text-primary",
    bg: "bg-amber-100 dark:bg-primary/60",
    border: "border-amber-300/60 dark:border-primary/40",
  },
  admin: {
    text: "text-sky-700 dark:text-sky-300",
    bg: "bg-sky-100 dark:bg-sky-950/60",
    border: "border-sky-300/60 dark:border-sky-700/40",
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildUsage(
  command: string,
  required?: CommandArg[],
  optional?: CommandArg[]
): string {
  const parts: string[] = [command];
  required?.forEach((a) => parts.push(`<${a.name}>`));
  optional?.forEach((a) => parts.push(`[${a.name}]`));
  return parts.join(" ");
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function CommandCard({
  command,
  description,
  required,
  optional,
  permission: permissionProp,
  roles: rolesProp,
  aliases,
  className,
}: CommandCardProps) {
  const t = useTranslations("CommandCard");
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  // Resolve permission and roles: prop > registry > default
  const registered = getPermission(command);
  const permission: GlobalPermission = permissionProp ?? registered?.permission ?? "all";
  const roles: string[] | undefined = rolesProp ?? registered?.roles;

  const hasArgs =
    (required && required.length > 0) || (optional && optional.length > 0);
  const hasRequired = required && required.length > 0;
  const hasOptional = optional && optional.length > 0;
  const perm = GLOBAL_PERMS[permission];


  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const commandText = command.trim();
    const textToCopy = commandText.startsWith("/")
      ? commandText
      : "/" + commandText;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt(t("copyManually"), textToCopy);
    }
  };


  return (
    <div
      className={cn(
        "liquid-card group relative mb-2 rounded-lg border overflow-hidden transition-colors duration-150",
        "bg-card/80 border-border/50",
        open ? "border-amber-800/50" : "hover:border-border/70",
        className
      )}
    >
      {/* Main row */}
      <div
        className={cn(
          "flex items-start gap-3 px-3 py-2.5",
          hasArgs && "cursor-pointer"
        )}
        onClick={hasArgs ? () => setOpen((v) => !v) : undefined}
      >
        {/* Left: command + description */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-foreground/60 font-mono text-sm shrink-0 select-none leading-none">
              /
            </span>

            <code className="font-mono text-sm text-foreground font-medium tracking-wide leading-tight whitespace-nowrap">
              {command.replace(/^\//, "")}
            </code>
          </div>

          <p className="mt-1 text-xs text-muted-foreground leading-snug">
            {description}
          </p>
        </div>

        {/* Right: argument badges + permission + roles */}
        <div className="flex flex-col items-end gap-1 shrink-0 pt-0.5">
          <div className="flex items-center gap-1.5">
            {hasRequired && (
              <span
                className="w-2 h-2 rounded-full bg-rose-500 border border-rose-400/60 shrink-0 inline-block"
                title={t("requiredArgsTitle")}
              />
            )}
            {hasOptional && (
              <span
                className="w-2 h-2 rounded-full bg-sky-500 border border-sky-400/60 shrink-0 inline-block"
                title={t("optionalArgsTitle")}
              />
            )}
            <span
              className={cn(
                "liquid-badge inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded border whitespace-nowrap",
                perm.text,
                perm.bg,
                perm.border
              )}
            >
              {t(`permissions.${permission}`)}
            </span>
          </div>

          {/* Roles badge */}
          {roles && roles.length > 0 && (
            <span className="liquid-badge inline-flex items-center gap-1 text-[11px] text-foreground/70 dark:text-muted-foreground bg-black/5 dark:bg-muted border border-black/10 dark:border-border/60 rounded px-1.5 py-0.5 whitespace-nowrap">
              <Lock size={9} className="text-foreground/50 dark:text-muted-foreground" />
              {roles.join(", ")}
            </span>
          )}
        </div>

        {/* Copy + expand */}
        <div className="flex items-center gap-2 shrink-0 pt-0.5 ml-1 min-w-12">
          <button
            onClick={handleCopy}
            title={t("copyCommand", { command })}
            className={cn(
              "p-1.5 rounded transition-all duration-150",
              "text-muted-foreground hover:text-foreground hover:bg-primary/10",
              copied && "text-emerald-400! hover:text-emerald-400!"
            )}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
          </button>

          {hasArgs && (
            <ChevronDown
              size={13}
              className={cn(
                "text-muted-foreground transition-transform duration-200",
                open && "rotate-180 text-foreground"
              )}
            />
          )}
        </div>
      </div>

      {/* Args panel */}
      {hasArgs && (
        <div
          className={cn(
            "overflow-hidden transition-all duration-200",
            open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <div className="border-t border-border/50 bg-card/60 px-3 py-2.5 space-y-2.5">
            <code className="block text-xs font-mono text-foreground/70">
              {buildUsage(command, required, optional)}
            </code>

            {hasRequired && (
              <div className="space-y-1.5">
                <p className="text-[10px] uppercase tracking-widest font-semibold text-rose-600/70 dark:text-rose-400/70">
                  {t("required")}
                </p>
                {required!.map((arg) => (
                  <div key={arg.name} className="flex items-baseline gap-2">
                    <code className="text-xs font-mono text-rose-700 dark:text-rose-300 shrink-0">
                      {"<"}
                      {arg.name}
                      {">"}
                    </code>
                    <span className="text-xs text-muted-foreground">
                      {arg.description}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {hasOptional && (
              <div className="space-y-1.5">
                <p className="text-[10px] uppercase tracking-widest font-semibold text-sky-600/70 dark:text-sky-400/70">
                  {t("optional")}
                </p>
                {optional!.map((arg) => (
                  <div key={arg.name} className="flex items-baseline gap-2">
                    <code className="text-xs font-mono text-sky-700 dark:text-sky-300 shrink-0">
                      [{arg.name}]
                    </code>
                    <span className="text-xs text-muted-foreground">
                      {arg.description}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Legacy: aliases */}
      {aliases && aliases.length > 0 && (
        <div className="border-t border-border/50 px-3 py-2 flex items-center gap-1.5 flex-wrap bg-card/40">
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
            {t("aliases")}
          </span>
          {aliases.map((a) => (
            <code
              key={a}
              className="liquid-badge text-[11px] font-mono text-muted-foreground border border-border bg-card px-1.5 py-0.5 rounded"
            >
              {a}
            </code>
          ))}
        </div>
      )}
    </div>
  );
}