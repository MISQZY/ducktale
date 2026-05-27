"use client";


import { useState } from "react";
import { cn } from "@/lib/utils";
import { Check, Copy, Lock, ChevronDown } from "lucide-react";


// ─── Types ────────────────────────────────────────────────────────────────────


type GlobalPermission = "all" | "old" | "supporter" | "admin";


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
  { label: string; text: string; bg: string; border: string; }
> = {
  all: {
    label: "Все игроки",
    text: "text-emerald-300",
    bg: "bg-emerald-950/60",
    border: "border-emerald-700/40",
  },
  old: {
    label: "Олд",
    text: "text-amber-300",
    bg: "bg-amber-950/60",
    border: "border-amber-700/40",
  },
  supporter: {
    label: "Донат",
    text: "text-gold-300",
    bg: "bg-gold-950/60",
    border: "border-gold-700/40",
  },
  admin: {
    label: "Администратор",
    text: "text-sky-300",
    bg: "bg-sky-950/60",
    border: "border-sky-700/40",
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
  permission = "all",
  roles,
  aliases,
  className,
}: CommandCardProps) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);


  const hasArgs =
    (required && required.length > 0) || (optional && optional.length > 0);
  const perm = GLOBAL_PERMS[permission];


  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const commandText = command.trim();
    const textToCopy = commandText.startsWith("/") ? commandText : "/" + commandText;


    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Скопируйте вручную:", textToCopy);
    }
  };


  return (
    <div
      className={cn(
        "group relative mb-2 rounded-lg border overflow-hidden transition-colors duration-150",
        "bg-stone-900/80 border-stone-700/50",
        open ? "border-amber-800/50" : "hover:border-stone-600/70",
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
            <span className="text-amber-600/60 font-mono text-sm shrink-0 select-none leading-none">
              /
            </span>

            <code className="font-mono text-sm text-amber-100 font-medium tracking-wide leading-tight whitespace-nowrap">
              {command.replace(/^\//, "")}
            </code>
          </div>

          <p className="mt-1 text-xs text-stone-400 leading-snug">
            {description}
          </p>
        </div>

        {/* Right: permission + roles */}
        <div className="flex flex-col items-end gap-1 shrink-0 pt-0.5">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded border whitespace-nowrap",
              perm.text,
              perm.bg,
              perm.border
            )}
          >
            {perm.label}
          </span>

          {roles && roles.length > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] text-stone-400 bg-stone-800 border border-stone-700/60 rounded px-1.5 py-0.5 whitespace-nowrap">
              <Lock size={9} className="text-stone-500" />
              {roles.join(", ")}
            </span>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 shrink-0 pt-0.5 ml-1 min-w-12">
          <button
            onClick={handleCopy}
            title={`Скопировать ${command}`}
            className={cn(
              "p-1.5 rounded transition-all duration-150",
              "text-stone-500 hover:text-amber-400 hover:bg-amber-400/10",
              copied && "text-emerald-400! hover:text-emerald-400!"
            )}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
          </button>

          {hasArgs && (
            <ChevronDown
              size={13}
              className={cn(
                "text-stone-500 transition-transform duration-200",
                open && "rotate-180 text-amber-500"
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
          <div className="border-t border-stone-700/50 bg-stone-950/60 px-3 py-2.5 space-y-2.5">
            <code className="block text-xs font-mono text-amber-400/70">
              {buildUsage(command, required, optional)}
            </code>

            {required && required.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] uppercase tracking-widest font-semibold text-rose-400/70">
                  Обязательные
                </p>
                {required.map((arg) => (
                  <div key={arg.name} className="flex items-baseline gap-2">
                    <code className="text-xs font-mono text-rose-300 shrink-0">
                      {"<"}{arg.name}{">"}
                    </code>
                    <span className="text-xs text-stone-400">{arg.description}</span>
                  </div>
                ))}
              </div>
            )}

            {optional && optional.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] uppercase tracking-widest font-semibold text-sky-400/70">
                  Необязательные
                </p>
                {optional.map((arg) => (
                  <div key={arg.name} className="flex items-baseline gap-2">
                    <code className="text-xs font-mono text-sky-300 shrink-0">
                      [{arg.name}]
                    </code>
                    <span className="text-xs text-stone-400">{arg.description}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Legacy: aliases */}
      {aliases && aliases.length > 0 && (
        <div className="border-t border-stone-700/50 px-3 py-2 flex items-center gap-1.5 flex-wrap bg-stone-950/40">
          <span className="text-[10px] text-stone-500 uppercase tracking-widest">
            Сокращения:
          </span>
          {aliases.map((a) => (
            <code
              key={a}
              className="text-[11px] font-mono text-stone-400 border border-stone-700 bg-stone-900 px-1.5 py-0.5 rounded"
            >
              {a}
            </code>
          ))}
        </div>
      )}
    </div>
  );
}