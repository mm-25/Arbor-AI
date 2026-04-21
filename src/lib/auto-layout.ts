import dagre from "@dagrejs/dagre";
import type { MindMapNode, MindMapEdge } from "@/store/mindmap-store";

// Per-shape dimensions matching actual rendered node sizes (+ padding for spacing)
const NODE_SIZES: Record<string, { w: number; h: number }> = {
  circle:        { w: 110, h: 110 },  // circle, 100px rendered
  rectangle:     { w: 140, h: 70 },   // rectangle, 120×60 rendered
  diamond:       { w: 130, h: 130 },  // diamond, 120×120 rendered
  "rounded-rect": { w: 140, h: 70 },  // rounded-rect
};
const DEFAULT_SIZE = { w: 140, h: 80 };

export function getLayoutedElements(
  nodes: MindMapNode[],
  edges: MindMapEdge[],
  direction: "TB" | "LR" = "LR"
): { nodes: MindMapNode[]; edges: MindMapEdge[] } {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));

  // Adaptive spacing based on graph size
  const count = nodes.length;
  const nodesep = count > 20 ? 80 : count > 10 ? 100 : 120;
  const ranksep = count > 20 ? 120 : count > 10 ? 140 : 160;

  g.setGraph({
    rankdir: direction,
    nodesep,
    ranksep,
    edgesep: 50,
    marginx: 40,
    marginy: 40,
  });

  // Use per-type node dimensions
  nodes.forEach((node) => {
    const size = NODE_SIZES[node.data?.type] || DEFAULT_SIZE;
    g.setNode(node.id, { width: size.w, height: size.h });
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  // Assign sourceHandle/targetHandle based on relative node positions after layout
  const layoutedEdges = edges.map((edge) => {
    const src = g.node(edge.source);
    const tgt = g.node(edge.target);
    if (!src || !tgt) return edge;

    const dx = tgt.x - src.x;
    const dy = tgt.y - src.y;

    let sourceHandle: string;
    let targetHandle: string;
    if (Math.abs(dx) >= Math.abs(dy)) {
      // Mostly horizontal
      if (dx >= 0) { sourceHandle = "right"; targetHandle = "left"; }
      else          { sourceHandle = "left";  targetHandle = "right"; }
    } else {
      // Mostly vertical
      if (dy >= 0) { sourceHandle = "bottom"; targetHandle = "top"; }
      else          { sourceHandle = "top";    targetHandle = "bottom"; }
    }

    return { ...edge, sourceHandle, targetHandle };
  });

  // Spread parallel edges that share the same source node + handle
  // so they don't overlap on top of each other
  const sourceHandleGroups = new Map<string, typeof layoutedEdges>();
  for (const edge of layoutedEdges) {
    const key = `${edge.source}::${edge.sourceHandle}`;
    if (!sourceHandleGroups.has(key)) sourceHandleGroups.set(key, []);
    sourceHandleGroups.get(key)!.push(edge);
  }

  const spreadEdges = layoutedEdges.map((edge) => {
    const key = `${edge.source}::${edge.sourceHandle}`;
    const group = sourceHandleGroups.get(key)!;
    if (group.length <= 1) return edge;

    const idx = group.indexOf(edge);
    const spread = 18; // px between parallel edges
    const offset = (idx - (group.length - 1) / 2) * spread;

    // For horizontal flow (right/left handles), spread vertically
    // For vertical flow (top/bottom handles), spread horizontally
    const isHorizontal = edge.sourceHandle === "right" || edge.sourceHandle === "left";
    return {
      ...edge,
      data: {
        ...(edge.data ?? {}),
        parallelOffset: offset,
        parallelAxis: isHorizontal ? "y" : "x",
      },
    };
  });

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = g.node(node.id);
    if (!nodeWithPosition) return node;

    // Only apply layout to AI-generated or new nodes (not manually positioned ones)
    const isNewNode =
      node.position.x === 0 && node.position.y === 0;
    const isAINode = node.data.source === "text" || node.data.source === "voice";

    if (isNewNode || isAINode) {
      const size = NODE_SIZES[node.data?.type] || DEFAULT_SIZE;
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - size.w / 2,
          y: nodeWithPosition.y - size.h / 2,
        },
      };
    }

    return node;
  });

  return { nodes: layoutedNodes, edges: spreadEdges };
}
