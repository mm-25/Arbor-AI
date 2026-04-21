/**
 * Parses Mermaid flowchart syntax into node/edge arrays for React Flow.
 *
 * Supports:
 * - Node shapes: ((actor)), [process], {decision}, (outcome), {{problem}}
 * - Edge definitions: A --> B, A -->|label| B, A -- "label" --> B
 * - Inline node definitions within edge lines
 * - Quoted and unquoted labels
 * - style/classDef lines (ignored gracefully)
 */

import type { NodeType } from "@/store/mindmap-store";

export interface ParsedNode {
  id: string;
  label: string;
  type: NodeType;
}

export interface ParsedEdge {
  source: string;
  target: string;
  label?: string;
}

export interface ParsedGraph {
  nodes: ParsedNode[];
  edges: ParsedEdge[];
}

// ── Shape → NodeType mapping ────────────────────────────────────────────────

/**
 * Detect the node type from Mermaid shape brackets and extract the label.
 *
 * Shapes (in order of specificity — double brackets must be checked first):
 *   {{label}}  → rounded-rect (hexagon in Mermaid, mapped to rounded-rect)
 *   ((label))  → circle
 *   (label)    → rounded-rect (stadium)
 *   {label}    → diamond (rhombus)
 *   [label]    → rectangle — default
 */
function parseNodeDefinition(raw: string): { id: string; label: string; type: NodeType } | null {
  const s = raw.trim();
  if (!s) return null;

  // Match: id + shape brackets
  // Try each pattern from most specific (double brackets) to least specific.

  // {{label}} — rounded-rect (was problem/hexagon)
  let m = s.match(/^([a-zA-Z_][\w]*)(\{\{)(.+?)(\}\})$/);
  if (m) return { id: m[1], label: cleanLabel(m[3]), type: "rounded-rect" };

  // ((label)) — circle
  m = s.match(/^([a-zA-Z_][\w]*)(\(\()(.+?)(\)\))$/);
  if (m) return { id: m[1], label: cleanLabel(m[3]), type: "circle" };

  // [label] — rectangle
  m = s.match(/^([a-zA-Z_][\w]*)(\[)(.+?)(\])$/);
  if (m) return { id: m[1], label: cleanLabel(m[3]), type: "rectangle" };

  // {label} — diamond
  m = s.match(/^([a-zA-Z_][\w]*)(\{)(.+?)(\})$/);
  if (m) return { id: m[1], label: cleanLabel(m[3]), type: "diamond" };

  // (label) — rounded-rect
  m = s.match(/^([a-zA-Z_][\w]*)(\()(.+?)(\))$/);
  if (m) return { id: m[1], label: cleanLabel(m[3]), type: "rounded-rect" };

  // Bare id with no shape — treat as rectangle
  m = s.match(/^([a-zA-Z_][\w]*)$/);
  if (m) return { id: m[1], label: m[1].replace(/_/g, " "), type: "rectangle" };

  return null;
}

/** Strip surrounding quotes and trim whitespace from a label. */
function cleanLabel(s: string): string {
  let label = s.trim();
  // Remove surrounding double or single quotes
  if ((label.startsWith('"') && label.endsWith('"')) ||
      (label.startsWith("'") && label.endsWith("'"))) {
    label = label.slice(1, -1);
  }
  return label.trim();
}

// ── Edge parsing ────────────────────────────────────────────────────────────

/**
 * Arrow patterns we recognize (with or without labels):
 *   A --> B
 *   A -->|label| B
 *   A -- "label" --> B
 *   A ---|label| B
 *   A -- label --> B
 *   A ==> B  (thick arrow, treat same as -->)
 *   A -.-> B (dotted arrow, treat same as -->)
 */
const ARROW_PATTERNS = [
  // -->|label|  or  ---|label|
  /^(.+?)\s*(?:-->|---|==>|-\.->)\s*\|(.+?)\|\s*(.+)$/,
  // -- "label" -->
  /^(.+?)\s*--\s*"(.+?)"\s*-->\s*(.+)$/,
  // -- label -->  (unquoted, greedy but safe since --> is unique)
  /^(.+?)\s*--\s+(.+?)\s+-->\s*(.+)$/,
  // Plain arrows (no label): -->, ==>, -.->
  /^(.+?)\s*(-->|==>|-\.->|---)\s*(.+)$/,
];

interface EdgeMatch {
  leftRaw: string;
  rightRaw: string;
  label?: string;
}

function matchEdge(line: string): EdgeMatch | null {
  for (const pattern of ARROW_PATTERNS) {
    const m = line.match(pattern);
    if (m) {
      // Patterns with 3 groups where group 2 is the label
      if (pattern === ARROW_PATTERNS[3]) {
        // Plain arrow, no label — group 2 is the arrow itself
        return { leftRaw: m[1].trim(), rightRaw: m[3].trim() };
      }
      return { leftRaw: m[1].trim(), rightRaw: m[3].trim(), label: cleanLabel(m[2]) };
    }
  }
  return null;
}

// ── Main parser ─────────────────────────────────────────────────────────────

export function parseMermaidToGraph(mermaid: string): ParsedGraph {
  const nodeMap = new Map<string, ParsedNode>();
  const edges: ParsedEdge[] = [];
  const seenEdges = new Set<string>();

  const lines = mermaid.split("\n");

  for (const rawLine of lines) {
    const line = rawLine.trim();

    // Skip empty lines, comments, directives
    if (!line || line.startsWith("%%") || line.startsWith(":::")) continue;

    // Skip graph header
    if (/^(graph|flowchart)\s+(LR|RL|TB|TD|BT)\s*$/i.test(line)) continue;
    // Also skip if it's just "graph" or "flowchart" alone
    if (/^(graph|flowchart)$/i.test(line)) continue;

    // Skip style/classDef/class/linkStyle lines
    if (/^(style|classDef|class|linkStyle|click)\s+/i.test(line)) continue;

    // Skip subgraph/end
    if (/^(subgraph|end)\b/i.test(line)) continue;

    // Try to parse as edge
    const edgeMatch = matchEdge(line);
    if (edgeMatch) {
      // Left and right sides may contain inline node definitions
      const leftNode = ensureNode(edgeMatch.leftRaw, nodeMap);
      const rightNode = ensureNode(edgeMatch.rightRaw, nodeMap);

      if (leftNode && rightNode) {
        const edgeKey = `${leftNode.id}->${rightNode.id}`;
        if (!seenEdges.has(edgeKey)) {
          seenEdges.add(edgeKey);
          edges.push({
            source: leftNode.id,
            target: rightNode.id,
            ...(edgeMatch.label ? { label: edgeMatch.label } : {}),
          });
        }
      }
      continue;
    }

    // Try to parse as standalone node definition
    const nodeDef = parseNodeDefinition(line);
    if (nodeDef && !nodeMap.has(nodeDef.id)) {
      nodeMap.set(nodeDef.id, { id: nodeDef.id, label: nodeDef.label, type: nodeDef.type });
    }
  }

  return {
    nodes: Array.from(nodeMap.values()),
    edges,
  };
}

/**
 * Ensure a node exists in the map. If the raw string is a node definition
 * (has shape brackets), parse and register it. If it's just a bare ID,
 * register it as a process node with the ID as label.
 */
function ensureNode(raw: string, nodeMap: Map<string, ParsedNode>): ParsedNode | null {
  const trimmed = raw.trim();

  // Try to parse as full node definition (id + shape)
  const parsed = parseNodeDefinition(trimmed);
  if (!parsed) return null;

  // If already registered, return existing (don't overwrite with bare-id defaults)
  const existing = nodeMap.get(parsed.id);
  if (existing) {
    // If existing was a bare-id default and this has real shape info, upgrade
    if (existing.label === existing.id.replace(/_/g, " ") && parsed.label !== parsed.id.replace(/_/g, " ")) {
      nodeMap.set(parsed.id, parsed);
      return parsed;
    }
    return existing;
  }

  nodeMap.set(parsed.id, parsed);
  return parsed;
}
