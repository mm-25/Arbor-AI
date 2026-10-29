/**
 * Converts mind map graph data into formats suitable for Figma import.
 *
 * Supports two export formats:
 * 1. Structured JSON – for the companion MapMind Figma plugin
 * 2. Mermaid.js – for pasting into FigJam diagrams
 */

import type { MindMapNode, MindMapEdge } from "@/store/mindmap-store";
import type { Point } from "./canvas-geometry";
import { getNodeVisualConfig } from "@/components/nodes/node-config";

// ── JSON export (for Figma plugin) ─────────────────────────────────────────

export interface FigmaExportPayload {
  appName: "Arbor AI";
  version: 1;
  exportedAt: string;
  nodes: FigmaExportNode[];
  edges: FigmaExportEdge[];
}

interface FigmaExportNode {
  id: string;
  label: string;
  type: string;
  x: number;
  y: number;
  color: string;
  bgColor: string;
  icon: string;
}

interface FigmaExportEdge {
  sourcePoint?: Point;
  targetPoint?: Point;
  source: string;
  target: string;
  label?: string;
}

export function graphToFigmaJSON(
  nodes: MindMapNode[],
  edges: MindMapEdge[],
): FigmaExportPayload {
  return {
    appName: "Arbor AI",
    version: 1,
    exportedAt: new Date().toISOString(),
    nodes: nodes.map((n) => {
      const vis = getNodeVisualConfig(n.data.type, n.data.color, n.data.icon);
      return {
        id: n.id,
        label: n.data.label,
        type: n.data.type,
        x: Math.round(n.position.x),
        y: Math.round(n.position.y),
        color: vis.color,
        bgColor: vis.bgColor,
        icon: vis.icon,
      };
    }),
    edges: edges.map((e) => ({
      source: e.source,
      target: e.target,
      ...(e.data?.sourcePoint
        ? { sourcePoint: { ...(e.data.sourcePoint as Point) } }
        : {}),
      ...(e.data?.targetPoint
        ? { targetPoint: { ...(e.data.targetPoint as Point) } }
        : {}),
      ...(e.label ? { label: String(e.label) } : {}),
    })),
  };
}

// ── Mermaid export (for FigJam) ────────────────────────────────────────────

/**
 * Escape a label for Mermaid syntax — wrap in quotes if it contains
 * characters that would break the parser.
 */
function mermaidLabel(s: string): string {
  // Always quote to be safe
  return `"${s.replace(/"/g, "'")}"`;
}

/**
 * Map node shape → Mermaid shape brackets.
 *   circle       → ((...))
 *   rectangle    → [...]
 *   diamond      → {...}
 *   rounded-rect → (...)
 */
function mermaidShape(id: string, label: string, type: string): string {
  const l = mermaidLabel(label);
  switch (type) {
    case "circle":
      return `${id}((${l}))`;
    case "rectangle":
      return `${id}[${l}]`;
    case "diamond":
      return `${id}{${l}}`;
    case "rounded-rect":
      return `${id}(${l})`;
    default:
      return `${id}[${l}]`;
  }
}

export function graphToMermaid(
  nodes: MindMapNode[],
  edges: MindMapEdge[],
): string {
  if (edges.some((edge) => edge.source === "" || edge.target === ""))
    throw new Error(
      "Mermaid requires node-attached connectors. Use PNG, editable map or Figma JSON for free endpoints.",
    );
  const lines: string[] = ["graph LR"];

  // Node definitions
  for (const n of nodes) {
    lines.push(`  ${mermaidShape(n.id, n.data.label, n.data.type)}`);
  }

  // Edge definitions
  for (const e of edges) {
    if (e.label) {
      lines.push(
        `  ${e.source} -->|${mermaidLabel(String(e.label))}| ${e.target}`,
      );
    } else {
      lines.push(`  ${e.source} --> ${e.target}`);
    }
  }

  // Style classes — group by visual appearance
  for (const n of nodes) {
    const vis = getNodeVisualConfig(n.data.type, n.data.color, n.data.icon);
    lines.push(
      `  style ${n.id} fill:${vis.bgColor},stroke:${vis.color},color:${vis.color}`,
    );
  }

  return lines.join("\n");
}
