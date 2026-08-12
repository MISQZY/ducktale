"use client";

import { useEffect, useRef } from "react";
import type { Node } from "@antv/x6";
import { cn } from "@/lib/utils";
import { SkinFace } from "@/components/common/SkinFace";
import { EXTERNAL_APIS } from "@/config/external-apis";
import { CheckSquare, Square, Lock, Gift, Target, Minus, Plus, Quote } from "lucide-react";
import type { QuestNodeDef, QuestStatus, QuestObjective, QuestReward } from "./types";

export interface QuestNodeData extends Omit<QuestNodeDef, "x" | "y" | "width" | "height"> {
  mockObjCompletions?: Record<string, boolean>;
  mockObjProgress?: Record<string, number>;
  onToggleComplete?: (nodeId: string) => void;
  onToggleObjective?: (nodeId: string, objId: string) => void;
  onChangeProgress?: (nodeId: string, objId: string, delta: number) => void;
  interactive?: boolean;
}

export function QuestNodeCard({ node }: { node: Node }) {
  const data = node.getData<QuestNodeData>();
  const cardRef = useRef<HTMLDivElement>(null);

  // Auto-resize the X6 node container when the React content changes height
  useEffect(() => {
    if (!cardRef.current) return;

    const observer = new ResizeObserver(() => {
      if (cardRef.current) {
        const requiredHeight = cardRef.current.offsetHeight;
        const currentSize = node.getSize();
        // Add a small 2px buffer to prevent fractional pixel jitter
        if (Math.abs(currentSize.height - requiredHeight) > 2) {
          node.resize(currentSize.width, requiredHeight);
        }
      }
    });

    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [node]);

  const isLocked = data.status === "locked";
  const isCompleted = data.status === "completed";
  const isActive = data.status === "active";

  // characterSkinUrl is already the fully-resolved answer (SkinsRestorer,
  // falling back to Mojang directly — see resolveCharacterSkins.ts) for
  // any node that went through that pipeline. Hand-authored content that
  // never calls it (and only ever sets characterName to a known-real
  // Mojang username) falls back to building the minotar.net URL here directly.
  const skinUrl = isLocked
    ? null
    : (data.characterSkinUrl ?? (data.characterName ? EXTERNAL_APIS.legacy_skin.skinUrl(data.characterName) : null));

  const displayName = data.npcName ?? data.characterName;

  return (
    <div
      ref={cardRef}
      className={cn(
        "h-fit w-full rounded-2xl border flex flex-col p-4 relative",
        "select-none cursor-grab active:cursor-grabbing transition-shadow duration-300 overflow-hidden",
        isCompleted && "bg-emerald-950/20 border-emerald-500/40",
        isActive && "bg-card/90 border-primary/40",
        isLocked && "bg-card/40 border-dashed border-2 border-primary/40",
        "backdrop-blur-md"
      )}
      style={{
        boxShadow: isCompleted
          ? "0 0 30px rgba(16, 185, 129, 0.1), 0 0 10px rgba(0,0,0,0.6)"
          : isActive
            ? "0 0 20px rgba(212, 160, 23, 0.15), 0 2px 20px rgba(0,0,0,0.6)"
            : "0 2px 10px rgba(0,0,0,0.4)",
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-3 relative z-10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <SkinFace
              skinUrl={skinUrl}
              size={38}
              className={cn(
                "rounded-xl transition-all",
                isLocked ? "border-primary/20 brightness-[0.25] saturate-0" : "border-primary/40"
              )}
            />
            {isLocked && (
              <div className="absolute inset-0 flex items-center justify-center text-primary/60">
                <Lock size={18} />
              </div>
            )}
          </div>
          <div className="flex flex-col">
            <span className={cn(
              "font-bold text-[0.95rem] tracking-wide leading-tight drop-shadow-sm",
              isLocked ? "text-foreground/50" : "text-foreground"
            )}>
              {data.title}
            </span>
            {displayName && !isLocked && (
              <span className="text-foreground/40 text-[0.7rem] font-mono mt-0.5">
                {displayName}
              </span>
            )}
            {isLocked && (
              <span className="text-foreground/40 text-[0.7rem] uppercase tracking-widest mt-0.5 font-semibold">
                Заблокировано
              </span>
            )}
          </div>
        </div>

        {data.interactive && !isLocked && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              data.onToggleComplete?.(data.id);
            }}
            className={cn(
              "p-2 rounded-xl transition-all duration-300 shrink-0",
              isCompleted
                ? "text-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/20 hover:scale-105"
                : "text-primary/50 hover:text-primary bg-primary/5 hover:bg-primary/10 hover:scale-105"
            )}
            title={isCompleted ? "Сбросить квест" : "Выполнить квест полностью"}
          >
            {isCompleted ? <CheckSquare size={18} /> : <Square size={18} />}
          </button>
        )}
      </div>

      <p className={cn(
        "text-xs leading-relaxed flex-1 relative z-10",
        isLocked ? "text-foreground/40 blur-[1px]" : "text-foreground/70"
      )}>
        {data.description}
      </p>

      {/* Objectives */}
      {!isLocked && data.objectives && data.objectives.length > 0 && (
        <div className="flex flex-col gap-2 mt-4 border-t border-primary/20 pt-3 relative z-10">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Target size={12} className="text-foreground/50" />
            <span className="text-[0.65rem] uppercase tracking-widest text-foreground/50 font-semibold">
              Цели
            </span>
          </div>
          {data.objectives.map((obj) => {
            if (obj.quote) {
              return (
                <div
                  key={obj.id}
                  className="flex items-start gap-2 rounded-lg border-l-2 border-primary/30 bg-primary/5 px-2.5 py-2"
                >
                  <Quote size={12} className="text-primary/50 shrink-0 mt-0.5" />
                  <span className="text-xs italic text-foreground/70 leading-relaxed">
                    {obj.label}
                  </span>
                </div>
              );
            }

            const hasProgress = typeof obj.current === "number" && typeof obj.total === "number";
            const actualCurrent = data.mockObjProgress?.[obj.id] ?? obj.current ?? 0;
            const progDone = hasProgress && actualCurrent >= obj.total!;
            const mockDone = data.mockObjCompletions?.[obj.id];
            const isObjComplete = obj.completed || progDone || mockDone || isCompleted;

            return (
              <div
                key={obj.id}
                className={cn(
                  "flex flex-col gap-1.5 p-1.5 -mx-1.5 rounded-lg transition-colors group",
                  data.interactive && !hasProgress && "cursor-pointer hover:bg-foreground/5"
                )}
                onClick={(e) => {
                  if (data.interactive && !hasProgress) {
                    e.stopPropagation();
                    data.onToggleObjective?.(data.id, obj.id);
                  }
                }}
              >
                <div className="flex items-start justify-between gap-2 text-xs">
                  <div className="flex items-start gap-2 text-foreground/70 flex-1">
                    <div className={cn(
                      "w-2 h-2 rounded-sm mt-0.5 shrink-0 transition-colors border",
                      isObjComplete ? "bg-emerald-500 border-emerald-500" : "bg-primary/10 border-primary/30"
                    )} />
                    <span className={cn("leading-tight", isObjComplete && "line-through opacity-50")}>
                      {obj.label}
                    </span>
                  </div>
                  {hasProgress && (
                    <div className="flex items-center gap-2">
                      {data.interactive && !isCompleted && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            className="p-1 hover:bg-foreground/10 rounded-md text-foreground/50 hover:text-foreground"
                            onClick={(e) => { e.stopPropagation(); data.onChangeProgress?.(data.id, obj.id, -1); }}
                          >
                            <Minus size={10} strokeWidth={3} />
                          </button>
                          <button
                            className="p-1 hover:bg-foreground/10 rounded-md text-foreground/50 hover:text-foreground"
                            onClick={(e) => { e.stopPropagation(); data.onChangeProgress?.(data.id, obj.id, 1); }}
                          >
                            <Plus size={10} strokeWidth={3} />
                          </button>
                        </div>
                      )}
                      <span className="text-[0.65rem] text-foreground/50 font-mono whitespace-nowrap bg-foreground/5 px-1.5 py-0.5 rounded-md">
                        {isObjComplete ? obj.total : actualCurrent} / {obj.total}
                      </span>
                    </div>
                  )}
                </div>
                {hasProgress && (
                  <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden ml-4 max-w-[calc(100%-16px)]">
                    <div
                      className={cn("h-full transition-all duration-300", isObjComplete ? "bg-emerald-500" : "bg-primary/60")}
                      style={{ width: `${isObjComplete ? 100 : Math.min(100, (actualCurrent / obj.total!) * 100)}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Rewards */}
      {!isLocked && data.rewards && data.rewards.length > 0 && (
        <div className="flex flex-col gap-1.5 mt-3 border-t border-primary/20 pt-3 relative z-10">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Gift size={12} className="text-amber-500/70" />
            <span className="text-[0.65rem] uppercase tracking-widest text-amber-500/70 font-semibold">
              Награды
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {data.rewards.map((rew) => (
              <span key={rew.id} className="px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-500/90 text-[0.65rem] border border-amber-500/30 font-medium shadow-sm shadow-amber-500/5">
                {rew.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {isCompleted && (
        <div className="absolute inset-0 bg-emerald-500/5 mix-blend-overlay pointer-events-none" />
      )}

      {/* Locked overlay tint */}
      {isLocked && (
        <div className="absolute inset-0 bg-background/40 pointer-events-none rounded-2xl" />
      )}
    </div>
  );
}
