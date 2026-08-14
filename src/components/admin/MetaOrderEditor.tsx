"use client";

import { ChevronUp, ChevronDown, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface MetaOrderEditorProps {
  content: string;
  onChange: (newContent: string) => void;
  /** Sibling folder/file names at this meta.json's level, for the "add page" list. */
  availableEntries: string[];
}

export function MetaOrderEditor({ content, onChange, availableEntries }: MetaOrderEditorProps) {
  const t = useTranslations("AdminContent");

  let parsed: Record<string, unknown> | null = null;
  let parseError: string | null = null;

  if (!content.trim()) {
    return null;
  }

  try {
    const value = JSON.parse(content) as unknown;
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      parseError = "Ожидается JSON-объект вида { \"pages\": [...] }";
    } else {
      parsed = value as Record<string, unknown>;
    }
  } catch (e) {
    parseError = e instanceof Error ? e.message : "Invalid JSON";
  }

  if (parseError) {
    return <p className="text-destructive text-sm font-mono whitespace-pre-wrap not-prose">{parseError}</p>;
  }

  const pages = Array.isArray(parsed?.pages)
    ? (parsed.pages as unknown[]).filter((p): p is string => typeof p === "string")
    : [];

  function applyPages(newPages: string[]) {
    onChange(`${JSON.stringify({ ...parsed, pages: newPages }, null, 2)}\n`);
  }

  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= pages.length) return;
    const next = [...pages];
    [next[index], next[target]] = [next[target], next[index]];
    applyPages(next);
  }

  function remove(index: number) {
    applyPages(pages.filter((_, i) => i !== index));
  }

  function add(name: string) {
    if (!name || pages.includes(name)) return;
    applyPages([...pages, name]);
  }

  const notListed = availableEntries.filter((e) => !pages.includes(e));

  return (
    <div className="space-y-3 not-prose">
      <p className="text-foreground/40 text-xs">{t("metaOrderHint")}</p>

      <ul className="space-y-1">
        {pages.map((page, i) => (
          <li
            key={page}
            className="flex items-center gap-2 rounded-lg border border-primary/15 bg-card/50 px-3 py-1.5 text-sm"
          >
            <span className="flex-1 truncate font-mono text-xs text-foreground/85">{page}</span>
            <button
              type="button"
              onClick={() => move(i, -1)}
              disabled={i === 0}
              className="text-foreground/50 hover:text-foreground disabled:opacity-25 disabled:pointer-events-none"
              aria-label={t("metaMoveUp")}
            >
              <ChevronUp size={14} />
            </button>
            <button
              type="button"
              onClick={() => move(i, 1)}
              disabled={i === pages.length - 1}
              className="text-foreground/50 hover:text-foreground disabled:opacity-25 disabled:pointer-events-none"
              aria-label={t("metaMoveDown")}
            >
              <ChevronDown size={14} />
            </button>
            <button
              type="button"
              onClick={() => remove(i)}
              className="text-destructive/60 hover:text-destructive"
              aria-label={t("metaRemove")}
            >
              <X size={14} />
            </button>
          </li>
        ))}
        {pages.length === 0 && <li className="text-foreground/30 text-xs italic">{t("metaEmptyList")}</li>}
      </ul>

      {notListed.length > 0 && (
        <Select value="" onValueChange={add}>
          <SelectTrigger className="w-full h-auto px-2 py-1.5 text-xs bg-card/50">
            <SelectValue placeholder={t("metaAddPage")} />
          </SelectTrigger>
          <SelectContent>
            {notListed.map((name) => (
              <SelectItem key={name} value={name}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
