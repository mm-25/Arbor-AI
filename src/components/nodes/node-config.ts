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

// Shape-based configs — each shape has a sensible default appearance
export const NODE_TYPE_CONFIGS: Record<NodeType, NodeTypeConfig> = {
  rectangle: {
    type: "rectangle",
    label: "Rectangle",
    color: "#6b7280",
    bgColor: "#f9fafb",
    borderColor: "#6b7280",
    shape: "rectangle",
    icon: "📋",
  },
  "rounded-rect": {
    type: "rounded-rect",
    label: "Rounded",
    color: "#22c55e",
    bgColor: "#f0fdf4",
    borderColor: "#22c55e",
    shape: "rounded-rect",
    icon: "💬",
  },
  circle: {
    type: "circle",
    label: "Circle",
    color: "#3b82f6",
    bgColor: "#eff6ff",
    borderColor: "#3b82f6",
    shape: "circle",
    icon: "👤",
  },
  diamond: {
    type: "diamond",
    label: "Diamond",
    color: "#eab308",
    bgColor: "#fefce8",
    borderColor: "#eab308",
    shape: "diamond",
    icon: "◇",
  },
};

// FigJam-style color presets for node customization
export const COLOR_PRESETS = [
  { name: "Gray", color: "#6b7280", bgColor: "#f9fafb", borderColor: "#6b7280" },
  { name: "Blue", color: "#3b82f6", bgColor: "#eff6ff", borderColor: "#3b82f6" },
  { name: "Green", color: "#22c55e", bgColor: "#f0fdf4", borderColor: "#22c55e" },
  { name: "Yellow", color: "#eab308", bgColor: "#fefce8", borderColor: "#eab308" },
  { name: "Red", color: "#ef4444", bgColor: "#fef2f2", borderColor: "#ef4444" },
  { name: "Purple", color: "#a855f7", bgColor: "#faf5ff", borderColor: "#a855f7" },
  { name: "Pink", color: "#ec4899", bgColor: "#fdf2f8", borderColor: "#ec4899" },
  { name: "Orange", color: "#f97316", bgColor: "#fff7ed", borderColor: "#f97316" },
];

// Map a color string to its preset (for resolving bgColor/borderColor from a stored color)
export function getColorPreset(color: string) {
  return COLOR_PRESETS.find((p) => p.color === color);
}

// Get the visual config for a node, applying per-node overrides
export function getNodeVisualConfig(
  type: NodeType,
  nodeColor?: string,
  nodeIcon?: string
): { color: string; bgColor: string; borderColor: string; icon: string; shape: string } {
  const base = NODE_TYPE_CONFIGS[type] ?? NODE_TYPE_CONFIGS.rectangle;
  const preset = nodeColor ? getColorPreset(nodeColor) : null;
  return {
    color: preset?.color ?? base.color,
    bgColor: preset?.bgColor ?? base.bgColor,
    borderColor: preset?.borderColor ?? base.borderColor,
    icon: nodeIcon ?? base.icon,
    shape: base.shape,
  };
}
