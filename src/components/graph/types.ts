import type { ElementType } from "react";
import { DIAGRAM_COLOR, DIAGRAM_LINE } from "@/config/site";

export type NodeColor = keyof typeof DIAGRAM_COLOR;
export type LineColor = keyof typeof DIAGRAM_LINE;
export type EdgeDirection = "forward" | "backward" | "both";

export interface Vec2 {
  x: number;
  y: number;
}

/** A node in a graph, fully resolved (copy already translated). */
export interface GraphNodeDef {
  id: string;
  label: string;
  sublabel?: string;
  tooltip?: string;
  icon: ElementType;
  color: NodeColor;
  dashed?: boolean;
}

/** An edge in a graph, fully resolved (copy already translated). */
export interface GraphEdgeDef {
  /** Stable identity for the edge, also used as its X6 cell id. */
  key: string;
  from: string;
  to: string;
  color?: LineColor;
  dashed?: boolean;
  direction?: EdgeDirection;
  tooltip?: string;
}

/** Payload stored on the X6 node cell, read by the react-shape component. */
export interface GraphNodeData {
  label: string;
  sublabel?: string;
  tooltip?: string;
  icon: ElementType;
  color: NodeColor;
  dashed?: boolean;
  active: boolean;
}

/** Payload stored on the X6 edge cell. */
export interface GraphEdgeData {
  tooltip?: string;
  color?: LineColor;
  dashed?: boolean;
  direction?: EdgeDirection;
}

export interface TooltipState {
  text: string;
  x: number;
  y: number;
  /** Container size at the moment of hover, used to keep the tooltip on-screen. */
  frameW: number;
  frameH: number;
}

export interface GraphDiagramProps {
  nodes: GraphNodeDef[];
  edges: GraphEdgeDef[];
  /** Initial position of each node, as an offset from the content center. */
  initOffsets: Record<string, Vec2>;
  /** Rendered above the graph canvas (e.g. a terminal-style title bar). Kept as-is in fullscreen too. */
  header?: React.ReactNode;
  /** Rendered as an absolutely-positioned overlay on top of the canvas (e.g. a legend). */
  overlay?: React.ReactNode;
  /** Card width/height in px. Defaults to the shared diagram card size. */
  cardWidth?: number;
  cardHeight?: number;
  /** Canvas viewport height in px. Defaults to the shared diagram frame height. */
  frameHeight?: number;
  /** Label for the fullscreen-toggle button when collapsed. */
  expandLabel?: string;
  /** Label for the fullscreen-toggle button when expanded. */
  collapseLabel?: string;
}
