import dagre from "@dagrejs/dagre";
import type { MindMapNode, MindMapEdge } from "@/store/mindmap-store";
import { nodeSize, graphBounds } from "./canvas-geometry";
import { connectionHandles } from "./edge-routing";
export type LayoutDirection = "AUTO" | "TB" | "LR";
const GAP = 48,
  RANK = 72;

/** Geometry only: a stable spanning forest organizes the primary structure;
 * supporting/cyclic edges remain in the graph and are routed independently. */
export function getLayoutedElements(
  nodes: MindMapNode[],
  edges: MindMapEdge[],
  direction: LayoutDirection = "AUTO",
): { nodes: MindMapNode[]; edges: MindMapEdge[] } {
  if (!nodes.length) return { nodes, edges };
  const byId = new Map(nodes.map((n) => [n.id, n]));
  // Explicit roles and process transitions take precedence over legacy punctuation.
  const isQuestion = (n: MindMapNode) =>
    n.data.role === "question" ||
    (!n.data.role &&
      /\?\s*$/.test(n.data.label) &&
      !edges.some(
        (edge) =>
          edge.source === n.id &&
          (edge.data?.relation === "transition" ||
            /^(?:yes|no)$/i.test(String(edge.label ?? ""))),
      ));
  const eligible = edges.filter(
    (e) =>
      byId.has(e.source) &&
      byId.has(e.target) &&
      e.source !== e.target &&
      !isQuestion(byId.get(e.source)!) &&
      e.data?.relation !== "reference",
  );
  const children = new Map(nodes.map((n) => [n.id, [] as string[]]));
  const incoming = new Map(nodes.map((n) => [n.id, 0]));
  eligible.forEach((e) =>
    incoming.set(e.target, (incoming.get(e.target) ?? 0) + 1),
  );
  const roots = nodes
    .filter((n) => !incoming.get(n.id) && !isQuestion(n))
    .map((n) => n.id);
  const visited = new Set<string>();
  const primary = new Set<string>();
  const visit = (id: string) => {
    if (visited.has(id)) return;
    visited.add(id);
    const targets = new Set(
      eligible.filter((e) => e.source === id).map((e) => e.target),
    );
    for (const node of nodes) {
      if (!targets.has(node.id) || visited.has(node.id)) continue;
      children.get(id)!.push(node.id);
      primary.add(`${id}\0${node.id}`);
      visit(node.id);
    }
  };
  roots.forEach(visit);
  for (const n of nodes)
    if (!visited.has(n.id)) {
      roots.push(n.id);
      visit(n.id);
    }
  const chosen =
    direction === "AUTO"
      ? Math.max(...[...children.values()].map((c) => c.length)) >= 3
        ? "TB"
        : "LR"
      : direction;
  const positions = new Map<string, { x: number; y: number }>();
  const listed = new Set<string>();
  if (chosen === "LR") {
    const g = new dagre.graphlib.Graph();
    g.setDefaultEdgeLabel(() => ({}));
    g.setGraph({
      rankdir: "LR",
      nodesep: 40,
      ranksep: 96,
      marginx: 40,
      marginy: 40,
    });
    nodes.forEach((n) => g.setNode(n.id, nodeSize(n)));
    for (const [id, ids] of children)
      for (const child of ids) g.setEdge(id, child);
    dagre.layout(g);
    nodes.forEach((n) => {
      const p = g.node(n.id),
        size = nodeSize(n);
      positions.set(n.id, {
        x: p.x - size.width / 2,
        y: p.y - size.height / 2,
      });
    });
  } else {
    interface Tree {
      id: string;
      width: number;
      height: number;
      children: Tree[];
      list: boolean;
    }
    const measure = (id: string): Tree => {
      const size = nodeSize(byId.get(id)!);
      const nested = children.get(id)!.map(measure);
      const list =
        nested.length >= 3 && nested.every((c) => !c.children.length);
      const width = list
        ? Math.max(size.width, ...nested.map((c) => c.width + 40))
        : Math.max(
            size.width,
            nested.reduce((sum, c) => sum + c.width, 0) +
              Math.max(0, nested.length - 1) * GAP,
          );
      const height =
        size.height +
        (nested.length
          ? RANK +
            (list
              ? nested.reduce((sum, c) => sum + c.height, 0) +
                (nested.length - 1) * 32
              : Math.max(...nested.map((c) => c.height)))
          : 0);
      return { id, width, height, children: nested, list };
    };
    const place = (tree: Tree, x: number, y: number) => {
      const size = nodeSize(byId.get(tree.id)!);
      positions.set(tree.id, { x: x + (tree.width - size.width) / 2, y });
      let cursor = x;
      let listY = y + size.height + RANK;
      const total =
        tree.children.reduce((sum, c) => sum + c.width, 0) +
        Math.max(0, tree.children.length - 1) * GAP;
      cursor += (tree.width - total) / 2;
      for (const child of tree.children) {
        if (tree.list) {
          listed.add(child.id);
          place(child, x + 40, listY);
          listY += child.height + 32;
        } else {
          place(child, cursor, y + size.height + RANK);
          cursor += child.width + GAP;
        }
      }
    };
    const trees = roots.map(measure);
    // A principal map keeps its disconnected questions adjacent; many islands pack in rows.
    const rowWidth = Math.max(1200, ...trees.map((t) => t.width));
    let x = 40,
      y = 40,
      rowHeight = 0;
    for (const tree of trees) {
      if (x > 40 && x + tree.width > rowWidth + 480) {
        x = 40;
        y += rowHeight + 120;
        rowHeight = 0;
      }
      place(tree, x, y);
      x += tree.width + 120;
      rowHeight = Math.max(rowHeight, tree.height);
    }
  }
  const arranged = nodes.map((n) => ({ ...n, position: positions.get(n.id)! }));
  const routed = edges.map((edge) => {
    if (edge.data?.sourcePoint || edge.data?.targetPoint) return edge;
    const data = { ...edge.data };
    delete data.corners;
    delete data.parallelOffset;
    delete data.parallelAxis;
    delete data.autoDashed;
    const primaryEdge = primary.has(`${edge.source}\0${edge.target}`);
    const handles = primaryEdge
      ? chosen === "TB"
        ? {
            sourceHandle: "bottom",
            targetHandle: listed.has(edge.target) ? "left" : "top",
          }
        : { sourceHandle: "right", targetHandle: "left" }
      : connectionHandles(arranged, edge.source, edge.target);
    return { ...edge, data: { ...data, autoDashed: false }, ...handles };
  });
  return { nodes: arranged, edges: routed };
}

/** Exposed for scoped commands and repeatable layout measurements. */
export { graphBounds };
