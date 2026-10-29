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

/** Split only outside shapes/quotes; punctuation inside labels is content. */
function statements(input: string): string[] {
  const result: string[] = [];
  let start = 0;
  let quote = "";
  let depth = 0;
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (quote) { if (c === quote && input[i - 1] !== "\\") quote = ""; continue; }
    if (c === '"' || c === "'") { quote = c; continue; }
    if ("[({".includes(c)) depth++;
    if ("])}".includes(c)) depth--;
    if ((c === ";" || c === "\n") && depth === 0) {
      result.push(input.slice(start, i).trim()); start = i + 1;
    }
  }
  result.push(input.slice(start).trim());
  return result;
}

function readNode(input: string): { raw: string; rest: string } | null {
  const id = input.match(/^\s*([a-zA-Z_]\w*)/);
  if (!id) return null;
  let end = id[0].length;
  let cursor = end;
  while (/\s/.test(input[cursor] ?? "") && cursor < input.length) cursor++;
  if (input[cursor] && "[({".includes(input[cursor])) {
    let depth = 0;
    let quote = "";
    for (; cursor < input.length; cursor++) {
      const c = input[cursor];
      if (quote) { if (c === quote && input[cursor - 1] !== "\\") quote = ""; continue; }
      if (c === '"' || c === "'") { quote = c; continue; }
      if ("[({".includes(c)) depth++;
      if ("])}".includes(c)) depth--;
      if (depth === 0) { end = cursor + 1; break; }
    }
    if (depth !== 0) return null;
  }
  return { raw: input.slice(0, end).trim(), rest: input.slice(end).trim() };
}

export function parseMermaidToGraph(mermaid: string): ParsedGraph {
  const nodeMap = new Map<string, ParsedNode>();
  const edges: ParsedEdge[] = [];
  const seenEdges = new Set<string>();
  function register(raw: string): ParsedNode | null {
    const node = parseNodeDefinition(raw);
    if (!node) return null;
    // Explicit definitions always supersede bare references; a bare reference
    // never erases an explicit label or shape.
    if (!nodeMap.has(node.id) || raw !== node.id) nodeMap.set(node.id, node);
    return nodeMap.get(node.id)!;
  }
  for (const line of statements(mermaid)) {
    if (!line || /^(%%|```|:::)/.test(line)) continue;
    if (/^(graph|flowchart|style|classDef|class|linkStyle|click|subgraph|end)\b/i.test(line)) continue;
    const first = readNode(line);
    if (!first) continue;
    let source = register(first.raw);
    let rest = first.rest;
    while (source && rest) {
      const arrow = rest.match(/^(?:-->|---|==>|-\.->)(?:\s*\|([^|]*)\|)?\s*/)
        ?? rest.match(/^--\s+("[^"]*"|'[^']*'|.+?)\s+-->\s*/);
      if (!arrow) break;
      const next = readNode(rest.slice(arrow[0].length));
      if (!next) break;
      const target = register(next.raw);
      if (!target) break;
      const label = arrow[1] === undefined ? undefined : cleanLabel(arrow[1]);
      const key = JSON.stringify([source.id, target.id, label ?? ""]);
      if (!seenEdges.has(key)) {
        seenEdges.add(key);
        edges.push({source: source.id, target: target.id, ...(label ? {label} : {})});
      }
      source = target;
      rest = next.rest;
    }
  }
  return {nodes: [...nodeMap.values()], edges};
}
