"use client";

import { useEffect, useState } from "react";
import { Loader2, AlertCircle, MapPinned } from "lucide-react";
import { QuestTree } from "@/components/quest-tree";
import type { QuestNodeDef } from "@/components/quest-tree/types";
import { cn } from "@/lib/utils";

interface LiveQuestTreeProps {
  /** Velocity-registered server name this quest line's package was synced from (e.g. "duckburg") — see BETONQUEST_QUEST_TREE.md. */
  server: string;
  /** BetonQuest package name (the QuestPackages/<name> folder) — one quest line per package, by convention. */
  packageName: string;
  title?: string;
  frameHeight?: number | string;
  className?: string;
}

type FetchState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; nodes: QuestNodeDef[] };

const FRAME_HEIGHT_FALLBACK = 600;

export function LiveQuestTree({ server, packageName, title, frameHeight = FRAME_HEIGHT_FALLBACK, className }: LiveQuestTreeProps) {
  const [state, setState] = useState<FetchState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });

    const params = new URLSearchParams({ server, package: packageName });
    fetch(`/api/quest-catalog?${params}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        return (await res.json()) as { nodes: QuestNodeDef[] };
      })
      .then((data) => {
        if (!cancelled) setState({ status: "success", nodes: data.nodes });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({
            status: "error",
            message: error instanceof Error ? error.message : "Неизвестная ошибка",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [server, packageName]);

  if (state.status === "loading") {
    return (
      <div
        className={cn(
          "not-prose flex flex-col items-center justify-center gap-3 rounded-2xl border border-primary/25 bg-card/60",
          className
        )}
        style={{ height: frameHeight }}
      >
        <Loader2 size={22} className="text-foreground/60 animate-spin" />
        <span className="text-sm text-foreground/50">Загрузка веток квестов...</span>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div
        className={cn(
          "not-prose flex flex-col items-center justify-center gap-2 rounded-2xl border border-red-900/30 bg-duck-stone/40 text-center px-6",
          className
        )}
        style={{ height: frameHeight }}
      >
        <AlertCircle size={20} className="text-red-500 dark:text-red-400 shrink-0" />
        <p className="text-red-600 dark:text-red-400 text-sm font-medium">Не удалось загрузить квесты</p>
        <p className="text-red-600/60 dark:text-red-400/60 text-xs">{state.message}</p>
      </div>
    );
  }

  if (state.nodes.length === 0) {
    return (
      <div
        className={cn(
          "not-prose flex flex-col items-center justify-center gap-2 rounded-2xl border border-primary/20 bg-card/40 text-center px-6",
          className
        )}
        style={{ height: frameHeight }}
      >
        <MapPinned size={20} className="text-foreground/40 shrink-0" />
        <p className="text-foreground/60 text-sm font-medium">Эта ветка ещё не синхронизирована</p>
        <p className="text-foreground/40 text-xs max-w-sm">
          Плагин на сервере ещё не отправил данные пакета «{packageName}», либо в нём пока нет ни одной цели (objective).
        </p>
      </div>
    );
  }

  return (
    <QuestTree
      id={`${server}:${packageName}`}
      title={title}
      nodes={state.nodes}
      frameHeight={frameHeight}
    />
  );
}
