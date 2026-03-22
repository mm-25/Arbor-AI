/**
 * Converts mind map graph data into formats suitable for Figma import.
 *
 * Supports two export formats:
 * 1. Structured JSON – for the companion MapMind Figma plugin
 * 2. Mermaid.js – for pasting into FigJam diagrams
 */

import type { MindMapNode, MindMapEdge } from "@/store/mindmap-store";
import { NODE_TYPE_CONFIGS } from "@/components/nodes/node-config";

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
  source: string;
  target: string;
  label?: string;
}

export function graphToFigmaJSON(
  nodes: MindMapNode[],
  edges: MindMapEdge[]
): FigmaExportPayload {
  return {
    appName: "Arbor AI",
    version: 1,
    exportedAt: new Date().toISOString(),
    nodes: nodes.map((n) => {
      const config = NODE_TYPE_CONFIGS[n.data.type] ?? NODE_TYPE_CONFIGS.process;
      return {
        id: n.id,
        label: n.data.label,
        type: n.data.type,
        x: Math.round(n.position.x),
        y: Math.round(n.position.y),
        color: config.color,
        bgColor: config.bgColor,
        icon: config.icon,
      };
    }),
    edges: edges.map((e) => ({
      source: e.source,
      target: e.target,
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
 * Map node type → Mermaid shape brackets.
 * Using standard Mermaid flowchart shapes:
 *   actor    → circle ((...))
 *   process  → rectangle [...]
 *   decision → diamond {...}
 *   outcome  → rounded-rect (...)
 *   problem  → hexagon {{...}}
 */
function mermaidShape(id: string, label: string, type: string): string {
  const l = mermaidLabel(label);
  switch (type) {
    case "actor":
      return `${id}((${l}))`;
    case "process":
      return `${id}[${l}]`;
    case "decision":
      return `${id}{${l}}`;
    case "outcome":
      return `${id}(${l})`;
    case "problem":
      return `${id}{{${l}}}`;
    default:
      return `${id}[${l}]`;
  }
}

export function graphToMermaid(
  nodes: MindMapNode[],
  edges: MindMapEdge[]
): string {
  const lines: string[] = ["graph LR"];

  // Node definitions
  for (const n of nodes) {
    lines.push(`  ${mermaidShape(n.id, n.data.label, n.data.type)}`);
  }

  // Edge definitions
  for (const e of edges) {
    if (e.label) {
      lines.push(`  ${e.source} -->|${mermaidLabel(String(e.label))}| ${e.target}`);
    } else {
      lines.push(`  ${e.source} --> ${e.target}`);
    }
  }

  // Style classes
  const nodesByType = new Map<string, string[]>();
  for (const n of nodes) {
    const list = nodesByType.get(n.data.type) || [];
    list.push(n.id);
    nodesByType.set(n.data.type, list);
  }

  for (const [type, ids] of nodesByType) {
    const config = NODE_TYPE_CONFIGS[type as keyof typeof NODE_TYPE_CONFIGS];
    if (config) {
      lines.push(`  style ${ids.join(",")} fill:${config.bgColor},stroke:${config.color},color:${config.color}`);
    }
  }

  return lines.join("\n");
}
