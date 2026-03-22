import type { NodeType } from "@/store/mindmap-store";

export interface NodeTypeConfig {
  type: NodeType;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  shape: "circle" | "rectangle" | "diamond" | "rounded-rect";
  icon: string;
}

export const NODE_TYPE_CONFIGS: Record<NodeType, NodeTypeConfig> = {
  actor: {
    type: "actor",
    label: "Actor",
    color: "#3b82f6",
    bgColor: "#eff6ff",
    borderColor: "#3b82f6",
    shape: "circle",
    icon: "👤",
  },
  process: {
    type: "process",
    label: "Process",
    color: "#6b7280",
    bgColor: "#f9fafb",
    borderColor: "#6b7280",
    shape: "rectangle",
    icon: "⚙️",
  },
  decision: {
    type: "decision",
    label: "Decision",
    color: "#eab308",
    bgColor: "#fefce8",
    borderColor: "#eab308",
    shape: "diamond",
    icon: "◇",
  },
  outcome: {
    type: "outcome",
    label: "Outcome",
    color: "#22c55e",
    bgColor: "#f0fdf4",
    borderColor: "#22c55e",
    shape: "rounded-rect",
    icon: "✓",
  },
  problem: {
    type: "problem",
    label: "Problem",
    color: "#ef4444",
    bgColor: "#fef2f2",
    borderColor: "#ef4444",
    shape: "rounded-rect",
    icon: "⚠",
  },
};
