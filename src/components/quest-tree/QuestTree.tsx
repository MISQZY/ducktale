"use client";

import React, { useEffect, useRef, useState, useId } from "react";
import { Graph, type Edge } from "@antv/x6";
import { GraphCanvas } from "@/components/graph/GraphCanvas";
import { edgeLineAttrs } from "@/components/graph/shapes";
import { QUEST_NODE_SHAPE } from "./shapes";
import type { QuestTreeProps, QuestNodeDef, QuestStatus } from "./types";
import type { QuestNodeData } from "./QuestNodeCard";
import { wireNodeCollisionResolution } from "@/components/graph/utils";

export function QuestTree({
  id,
  title,
  nodes,
  frameHeight = 600,
  mockLocalStorage = false,
}: QuestTreeProps) {
  const rawId = useId();
  const graphRef = useRef<Graph | null>(null);

  // Local storage state for quest completions (only used if mockLocalStorage is true)
  const [completions, setCompletions] = useState<Record<string, number | boolean>>({});
  const initialCompletionsRef = useRef<Record<string, number | boolean>>({});



  const updateAllNodes = React.useCallback((currentCompletions: Record<string, number | boolean>) => {
    try {
      localStorage.setItem(`quests-${id}`, JSON.stringify(currentCompletions));
    } catch (e) {
      console.error("Failed to save quest completions", e);
    }
    
    if (!graphRef.current) return;

    const computedStatus: Record<string, QuestStatus> = {};
    const computedObjCompletions: Record<string, Record<string, boolean>> = {};
    const computedObjProgress: Record<string, Record<string, number>> = {};

    let changed = true;
    while (changed) {
      changed = false;
      for (const n of nodes) {
        let status: QuestStatus = n.status;
        let isCompleted = !!currentCompletions[n.id];
        
        const depsMet = !n.prerequisites || n.prerequisites.every(p => {
          return computedStatus[p] === "completed" || (computedStatus[p] === undefined && !!currentCompletions[p]);
        });

        if (!depsMet) {
          status = "locked";
          isCompleted = false;
        } else if (isCompleted) {
          status = "completed";
        } else {
          status = "active";
        }

        if (computedStatus[n.id] !== status) {
          computedStatus[n.id] = status;
          changed = true;
        }

        computedObjCompletions[n.id] = {};
        computedObjProgress[n.id] = {};
        if (n.objectives) {
          for (const obj of n.objectives) {
            const hasProgress = typeof obj.current === "number" && typeof obj.total === "number";
            const progKey = `${n.id}_obj_${obj.id}_progress`;
            const c = typeof currentCompletions[progKey] === "number" ? (currentCompletions[progKey] as number) : (obj.current || 0);
            const progDone = hasProgress && c >= obj.total!;
            
            if (hasProgress) {
              computedObjProgress[n.id][obj.id] = isCompleted ? obj.total! : c;
            }
            
            computedObjCompletions[n.id][obj.id] = isCompleted || progDone || !!currentCompletions[`${n.id}_obj_${obj.id}`];
          }
        }
      }
    }

    for (const n of nodes) {
      const nodeCell = graphRef.current.getCellById(n.id);
      if (nodeCell && nodeCell.isNode()) {
        nodeCell.setData({ 
          status: computedStatus[n.id],
          mockObjCompletions: computedObjCompletions[n.id],
          mockObjProgress: computedObjProgress[n.id],
        });
      }
    }
  }, [id, nodes]);

  const toggleComplete = React.useCallback((nodeId: string) => {
    if (!mockLocalStorage) return;
    
    setCompletions((prev) => {
      const next = { ...prev };
      const isNowCompleted = !prev[nodeId];
      next[nodeId] = isNowCompleted;
      
      const nodeDef = nodes.find(n => n.id === nodeId);
      if (isNowCompleted && nodeDef?.objectives) {
        for (const obj of nodeDef.objectives) {
          next[`${nodeId}_obj_${obj.id}`] = true;
          if (typeof obj.total === "number") next[`${nodeId}_obj_${obj.id}_progress`] = obj.total;
        }
      } else if (!isNowCompleted && nodeDef?.objectives) {
        for (const obj of nodeDef.objectives) {
          next[`${nodeId}_obj_${obj.id}`] = false;
          if (typeof obj.total === "number") next[`${nodeId}_obj_${obj.id}_progress`] = 0;
        }
      }

      updateAllNodes(next);
      return next;
    });
  }, [mockLocalStorage, nodes, updateAllNodes]);

  const toggleObjective = React.useCallback((nodeId: string, objId: string) => {
    if (!mockLocalStorage) return;

    setCompletions((prev) => {
      const next = { ...prev };
      const objKey = `${nodeId}_obj_${objId}`;
      const isObjNowCompleted = !prev[objKey];
      next[objKey] = isObjNowCompleted;

      const nodeDef = nodes.find(n => n.id === nodeId);
      const objDef = nodeDef?.objectives?.find(o => o.id === objId);
      
      if (objDef && typeof objDef.total === "number") {
        next[`${nodeId}_obj_${objId}_progress`] = isObjNowCompleted ? objDef.total : 0;
      }

      if (nodeDef?.objectives) {
        const allDone = nodeDef.objectives.every(obj => {
          if (obj.id === objId) return isObjNowCompleted;
          const hasProgress = typeof obj.current === "number" && typeof obj.total === "number";
          const progKey = `${nodeId}_obj_${obj.id}_progress`;
          const c = typeof next[progKey] === "number" ? next[progKey] : (obj.current || 0);
          if (hasProgress && c >= obj.total!) return true;
          return !!next[`${nodeId}_obj_${obj.id}`];
        });
        
        next[nodeId] = allDone;
      }

      updateAllNodes(next);
      return next;
    });
  }, [mockLocalStorage, nodes, updateAllNodes]);

  const changeProgress = React.useCallback((nodeId: string, objId: string, delta: number) => {
    if (!mockLocalStorage) return;

    setCompletions((prev) => {
      const next = { ...prev };
      const nodeDef = nodes.find(n => n.id === nodeId);
      const objDef = nodeDef?.objectives?.find(o => o.id === objId);
      if (!objDef || typeof objDef.total !== "number") return prev;

      const progressKey = `${nodeId}_obj_${objId}_progress`;
      const current = typeof next[progressKey] === "number" ? (next[progressKey] as number) : (objDef.current || 0);
      
      const newProgress = Math.max(0, Math.min(objDef.total, current + delta));
      next[progressKey] = newProgress;
      next[`${nodeId}_obj_${objId}`] = newProgress >= objDef.total;

      if (nodeDef?.objectives) {
        const allDone = nodeDef.objectives.every(obj => {
          if (obj.id === objId) return newProgress >= objDef.total!;
          const hasProgress = typeof obj.current === "number" && typeof obj.total === "number";
          const progKey = `${nodeId}_obj_${obj.id}_progress`;
          const c = typeof next[progKey] === "number" ? (next[progKey] as number) : (obj.current || 0);
          if (hasProgress && c >= obj.total!) return true;
          return !!next[`${nodeId}_obj_${obj.id}`];
        });
        
        next[nodeId] = allDone;
      }

      updateAllNodes(next);
      return next;
    });
  }, [mockLocalStorage, nodes, updateAllNodes]);

  useEffect(() => {
    if (mockLocalStorage) {
      try {
        const stored = localStorage.getItem(`quests-${id}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          initialCompletionsRef.current = parsed;
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setCompletions(parsed);
          updateAllNodes(parsed);
        }
      } catch (e) {
        console.error("Failed to parse quest completions", e);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, mockLocalStorage, updateAllNodes]);

  const initGraph = React.useCallback((graph: Graph) => {
    graphRef.current = graph;

    wireNodeCollisionResolution(graph, { margin: 20, onResize: true });

    const computedStatus: Record<string, QuestStatus> = {};
    const computedObjCompletions: Record<string, Record<string, boolean>> = {};
    const computedObjProgress: Record<string, Record<string, number>> = {};
    
    if (mockLocalStorage) {
      let changed = true;
      while (changed) {
        changed = false;
        for (const n of nodes) {
          const status: QuestStatus = n.status;
          const isCompleted = !!initialCompletionsRef.current[n.id];
          
          const depsMet = !n.prerequisites || n.prerequisites.every(p => {
            return computedStatus[p] === "completed" || (computedStatus[p] === undefined && !!initialCompletionsRef.current[p]);
          });

          let finalStatus = status;
          let finalCompleted = isCompleted;

          if (!depsMet) {
            finalStatus = "locked";
            finalCompleted = false;
          } else if (finalCompleted) {
            finalStatus = "completed";
          } else {
            finalStatus = "active";
          }

          if (computedStatus[n.id] !== finalStatus) {
            computedStatus[n.id] = finalStatus;
            changed = true;
          }

          computedObjCompletions[n.id] = {};
          computedObjProgress[n.id] = {};
          if (n.objectives) {
            for (const obj of n.objectives) {
              const hasProgress = typeof obj.current === "number" && typeof obj.total === "number";
              const progKey = `${n.id}_obj_${obj.id}_progress`;
              const c = typeof initialCompletionsRef.current[progKey] === "number" ? (initialCompletionsRef.current[progKey] as number) : (obj.current || 0);
              const progDone = hasProgress && c >= obj.total!;
              
              if (hasProgress) {
                computedObjProgress[n.id][obj.id] = finalCompleted ? obj.total! : c;
              }
              
              computedObjCompletions[n.id][obj.id] = finalCompleted || progDone || !!initialCompletionsRef.current[`${n.id}_obj_${obj.id}`];
            }
          }
        }
      }
    }

    const computedEdges: { from: string; to: string; dashed?: boolean }[] = [];
    
    for (const n of nodes) {
      const status = mockLocalStorage ? (computedStatus[n.id] || "locked") : n.status;
      const objComps = mockLocalStorage ? computedObjCompletions[n.id] : {};
      const objProgs = mockLocalStorage ? computedObjProgress[n.id] : {};

      graph.addNode({
        id: n.id,
        shape: QUEST_NODE_SHAPE,
        x: n.x,
        y: n.y,
        width: n.width ?? 320,
        height: n.height ?? 220,
        data: {
          id: n.id,
          characterName: n.characterName,
          characterSkinUrl: n.characterSkinUrl,
          legacy: n.legacy,
          npcName: n.npcName,
          title: n.title,
          description: n.description,
          objectives: n.objectives,
          rewards: n.rewards,
          status,
          mockObjCompletions: objComps,
          mockObjProgress: objProgs,
          interactive: mockLocalStorage,
          onToggleComplete: toggleComplete,
          onToggleObjective: toggleObjective,
          onChangeProgress: changeProgress,
        },
      });

      if (n.prerequisites) {
        for (const p of n.prerequisites) {
          computedEdges.push({ from: p, to: n.id, dashed: false });
        }
      }
      
      if (n.optionalPrerequisites) {
        for (const p of n.optionalPrerequisites) {
          computedEdges.push({ from: p, to: n.id, dashed: true });
        }
      }
    }

    for (const e of computedEdges) {
      graph.addEdge({
        source: e.from,
        target: e.to,
        zIndex: 0,
        attrs: { line: edgeLineAttrs("gold", e.dashed, "forward") },
      });
    }

  }, [nodes, mockLocalStorage, toggleComplete, toggleObjective, changeProgress]);

  return (
    <GraphCanvas
      header={title}
      frameHeight={frameHeight}
      onInit={initGraph}
      graphOptions={{
        interacting: {
          nodeMovable: true,
          edgeMovable: false,
          edgeLabelMovable: false,
          arrowheadMovable: false,
          vertexMovable: false,
          magnetConnectable: false,
        },
        connecting: {
          router: { name: "manhattan", args: { padding: 20 } },
          connector: { name: "rounded", args: { radius: 12 } },
        },
      }}
    />
  );
}
