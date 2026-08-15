"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export interface ThreadTreeItem {
  id: string;
  title: string;
  authorNickname: string;
  updatedAt: string; // ISO
}

interface ThreadTreeProps {
  lang: string;
  threads: ThreadTreeItem[];
}

function dateGroupLabel(iso: string, lang: string): string {
  return new Date(iso).toLocaleDateString(lang === "ru" ? "ru-RU" : "en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Left sidebar of /threads — a flat, most-recently-active-first list of every thread, visually grouped under a date heading per calendar day. */
export function ThreadTree({ lang, threads }: ThreadTreeProps) {
  const t = useTranslations("Threads");
  const pathname = usePathname();
  const activeId = pathname.match(/^\/threads\/([^/]+)$/)?.[1];

  const groups = useMemo(() => {
    const map = new Map<string, ThreadTreeItem[]>();
    for (const thread of threads) {
      const key = dateGroupLabel(thread.updatedAt, lang);
      const list = map.get(key) ?? [];
      list.push(thread);
      map.set(key, list);
    }
    return Array.from(map.entries());
  }, [threads, lang]);

  return (
    <aside className="w-full h-full flex flex-col min-w-0 overflow-hidden rounded-2xl border border-primary/20 bg-card/50 p-4">
      <Link
        href="/threads/new"
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "w-full gap-1.5 mb-4 shrink-0 bg-card/50 hover:bg-card/80"
        )}
      >
        <Plus size={14} />
        {t("newThread")}
      </Link>

      <div className="h-px bg-primary/10 shrink-0 -mx-4 mb-4" />

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-2">
        {threads.length === 0 ? (
          <p className="text-xs text-foreground/40 text-center py-6">{t("noThreads")}</p>
        ) : (
          <div className="space-y-4">
            {groups.map(([label, items]) => (
              <div key={label}>
                <h3 className="text-[11px] uppercase tracking-widest text-foreground/40 mb-1.5 px-1">{label}</h3>
                <ul className="space-y-0.5">
                  {items.map((thread) => (
                    <li key={thread.id}>
                      <Link
                        href={`/threads/${thread.id}`}
                        className={cn(
                          "flex flex-col gap-0.5 w-full text-left px-2.5 py-2 rounded-lg text-sm transition-colors",
                          activeId === thread.id
                            ? "bg-primary/10 text-primary/90"
                            : "text-foreground/70 hover:bg-primary/5 hover:text-foreground/90"
                        )}
                      >
                        <span className="truncate font-medium">{thread.title}</span>
                        <span className="truncate text-[0.65rem] text-foreground/40">{thread.authorNickname}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
