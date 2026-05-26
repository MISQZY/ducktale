export interface NodeDef {
  id: string;
  label: string;
  sublabel?: string;
  icon: React.ElementType;
  color: "gold" | "emerald" | "sky" | "violet" | "rose" | "amber";
  tooltip: string;
}

export interface EdgeDef {
  from: string;
  to: string;
  dashed?: boolean;
  tooltip?: string;
  color?: "gold" | "white" | "emerald" | "sky" | "violet" | "amber";
}

export interface Vec2 {
  x: number;
  y: number;
}

export interface TooltipState {
  text: string;
  fx: number;
  fy: number;
}

export interface NodeDiagramProps {
  nodes: NodeDef[];
  edges: EdgeDef[];
  initOffsets: Record<string, Vec2>;
  title?: React.ReactNode;
  header?: React.ReactNode;
}
