/**
 * Network topology data for the interactive infrastructure diagram.
 * Add/remove nodes and edges here — the diagram renders them automatically.
 * Copy (label/sublabel/tooltip) lives in the `Infrastructure` message
 * namespace, keyed by `id` (nodes) / `key` (edges); see NetworkDiagram.tsx.
 */
import { Shield, Globe, Server, Users, RefreshCw, Home, Mic } from "lucide-react";
import type { Vec2 } from "@/components/node-diagram/types";

export const DIAGRAM_INIT_OFFSETS: Record<string, Vec2> = {
  client:   { x: -366, y: -220 },
  proxy:    { x: -228, y: -100 },
  auth:     { x: -84,  y: 0    },
  hub:      { x: 68,   y: 100  },
  duckburg: { x: 134,  y: 255  },
  duckhood: { x: 274,  y: 188  },
  backup:   { x: 326,  y: -73  },
  voice:    { x: -244, y: 125  },
};

export interface DiagramNodeDef {
  id: string;
  icon: React.ElementType;
  color: "gold" | "emerald" | "sky" | "violet" | "rose" | "amber";
  dashed?: boolean;
}

export const DIAGRAM_NODE_DEFS: DiagramNodeDef[] = [
  { id: "client",   icon: Users,     color: "gold" },
  { id: "proxy",    icon: Globe,     color: "violet" },
  { id: "auth",     icon: Shield,    color: "rose", dashed: true },
  { id: "hub",      icon: Home,      color: "amber" },
  { id: "duckburg", icon: Server,    color: "emerald" },
  { id: "duckhood", icon: Server,    color: "sky" },
  { id: "backup",   icon: RefreshCw, color: "gold", dashed: true },
  { id: "voice",    icon: Mic,       color: "gold", dashed: true },
];

export interface DiagramEdgeDef {
  /** Key into `Infrastructure.edges` for the tooltip. */
  key: string;
  from: string;
  to: string;
  color: "gold" | "white" | "emerald" | "sky" | "violet" | "amber";
  dashed?: boolean;
  direction?: "forward" | "backward" | "both";
}

export const DIAGRAM_EDGE_DEFS: DiagramEdgeDef[] = [
  { key: "clientToProxy",      from: "client",   to: "proxy",    color: "white" },
  { key: "proxyToAuth",        from: "proxy",    to: "auth",     color: "gold" },
  { key: "authToHub",          from: "auth",     to: "hub",      color: "gold" },
  { key: "hubToDuckhood",      from: "hub",      to: "duckhood", color: "gold", direction: "both" },
  { key: "hubToDuckburg",      from: "hub",      to: "duckburg", color: "gold", direction: "both" },
  { key: "duckhoodToDuckburg", from: "duckhood", to: "duckburg", color: "gold", direction: "both" },
  { key: "backupToDuckburg",   from: "backup",   to: "duckburg", color: "violet", dashed: true },
  { key: "backupToDuckhood",   from: "backup",   to: "duckhood", color: "violet", dashed: true },
  { key: "voiceToDuckburg",    from: "voice",    to: "duckburg", color: "violet", dashed: true },
  { key: "voiceToDuckhood",    from: "voice",    to: "duckhood", color: "violet", dashed: true },
  { key: "voiceToHub",         from: "voice",    to: "hub",      color: "violet", dashed: true },
];

export const DIAGRAM_LEGEND_LINE_DEFS = [
  { key: "public",   color: "white",  dashed: false },
  { key: "secure",   color: "gold",   dashed: false },
  { key: "services", color: "violet", dashed: true  },
] as const;

export const DIAGRAM_LEGEND_NODE_DEFS = [
  { key: "core", dashed: false },
  { key: "aux",  dashed: true  },
] as const;
